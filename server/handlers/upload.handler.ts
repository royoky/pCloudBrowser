/**
 * Upload handler — POST /api/{provider}/upload
 *
 * Receives a multipart/form-data request from Uppy (VueFinder's uploader):
 *   - `file`  field: the file bytes
 *   - `path`  meta field: target directory path
 *
 * Uses busboy for multipart parsing: H3's readMultipartFormData has an
 * "Invalid array length" bug above ~10 MB, and readFormData caps at ~50 MB.
 *
 * The raw body is read via H3's `readRawBody`, which works across runtimes:
 *   - Cloudflare Pages: Nitro buffers the body and exposes it as
 *     `event.node.req.body` (the request is a node-mock-http stub whose
 *     `.pipe()` is a no-op — piping it would hang the worker forever).
 *   - Node.js dev server: reads the real IncomingMessage stream.
 * busboy is then fed the whole buffer in one shot via `bb.end(body)`.
 *
 * Upload size is bounded by the platform's request body limit
 * (~100 MB on Cloudflare; the cloudflare-pages preset fully buffers the
 * body in memory before this handler runs, so streaming is not possible here).
 */

import { Buffer } from 'node:buffer'
import busboy from 'busboy'
import { toItemDto } from '~~/server/presenters/file-system.presenter'
import { toHttpError } from '~~/server/utils/http-error'
import { resolveRepository } from '~~/server/utils/repository.resolver'

interface ParsedUpload {
  parentPath: string
  name: string
  mimeType: string
  fileData: Uint8Array
}

function parseMultipart(
  contentType: string,
  body: Buffer,
): Promise<ParsedUpload> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: { 'content-type': contentType } })

    let parentPath: string | undefined
    let name: string
    let mimeType: string
    const chunks: Buffer[] = []

    bb.on('field', (fieldname, value) => {
      if (fieldname === 'path')
        parentPath = value
    })

    bb.on('file', (_field, stream, info) => {
      name = info.filename || 'upload'
      mimeType = info.mimeType || 'application/octet-stream'
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('error', reject)
    })

    bb.on('finish', () => {
      if (!parentPath) {
        return reject(
          createError({
            statusCode: 400,
            statusMessage: 'BAD_REQUEST',
            message: 'Missing `path` field',
          }),
        )
      }
      if (!chunks.length) {
        return reject(
          createError({
            statusCode: 400,
            statusMessage: 'BAD_REQUEST',
            message: 'No file received',
          }),
        )
      }

      resolve({
        parentPath,
        name,
        mimeType,
        fileData: new Uint8Array(Buffer.concat(chunks)),
      })
    })

    bb.on('error', reject)

    // The body is already fully buffered (see file header), so feed busboy
    // the whole payload in one shot. Avoids relying on a pipeable request
    // stream, which the cloudflare-pages mock request does not provide.
    bb.end(body)
  })
}

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

  let parsed: Awaited<ReturnType<typeof parseMultipart>>
  try {
    parsed = await parseMultipart(contentType, body)
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'PARSE_ERROR',
      message: `Multipart parse failed: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  const { parentPath, name, mimeType, fileData } = parsed

  try {
    const file = await repository.uploadFile(parentPath, fileData, name, mimeType)
    return toItemDto(file)
  }
  catch (error) {
    throw toHttpError(error)
  }
})
