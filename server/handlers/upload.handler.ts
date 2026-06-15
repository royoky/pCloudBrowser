/**
 * Upload handler — POST /api/{provider}/upload
 *
 * Receives a multipart/form-data request from Uppy (VueFinder's uploader):
 *   - `file`  field: the file bytes
 *   - `path`  meta field: target directory path
 *
 * Parsing strategy — Web-native FormData over the buffered body:
 *   - busboy was tried but relies on `Buffer.prototype.latin1Slice`, a Node
 *     internal that Cloudflare's workerd Buffer polyfill does not implement.
 *   - H3's `readMultipartFormData` has an "Invalid array length" bug above
 *     ~10 MB, and `readFormData` caps at ~50 MB.
 *   - `new Response(body).formData()` uses the runtime's own multipart parser
 *     (workerd and Node 24 alike), with no artificial cap and no Node-internal
 *     Buffer methods.
 *
 * The raw body is read via H3's `readRawBody`, which works across runtimes
 * (the cloudflare-pages preset exposes the body as `event.node.req.body`; the
 * Node dev server streams the real IncomingMessage). That preset buffers the
 * whole body in memory before this handler runs, so parsing the buffered body
 * costs nothing extra — and true streaming is not possible here regardless.
 * Upload size is therefore bounded by the platform request body limit
 * (~100 MB on Cloudflare).
 */

import { toItemDto } from '~~/server/presenters/file-system.presenter'
import { toHttpError } from '~~/server/utils/http-error'
import { resolveRepository } from '~~/server/utils/repository.resolver'

export const uploadHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)

  const contentType = getHeader(event, 'content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      message: 'Expected multipart/form-data',
    })
  }

  const body = await readRawBody(event, false)
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      message: 'Empty request body',
    })
  }

  let formData: FormData
  try {
    // `body` is a Buffer (a Uint8Array) — a valid BodyInit at runtime; the cast
    // only sidesteps the Buffer<ArrayBufferLike> vs BufferSource generic mismatch.
    formData = await new Response(body as BodyInit, {
      headers: { 'content-type': contentType },
    }).formData()
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'PARSE_ERROR',
      message: `Multipart parse failed: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  const parentPath = formData.get('path')
  if (typeof parentPath !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      message: 'Missing `path` field',
    })
  }

  const file = formData.get('file')
  if (!(file instanceof Blob)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      message: 'No file received',
    })
  }

  const fileData = new Uint8Array(await file.arrayBuffer())
  const name = file instanceof File && file.name ? file.name : 'upload'
  const mimeType = file.type || 'application/octet-stream'

  try {
    const uploaded = await repository.uploadFile(parentPath, fileData, name, mimeType)
    return toItemDto(uploaded)
  }
  catch (error) {
    throw toHttpError(error)
  }
})
