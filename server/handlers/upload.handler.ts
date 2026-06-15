/**
 * Upload handler — POST /api/{provider}/upload
 *
 * The client (Uppy, formData: false) sends the file as the raw request body,
 * with the target directory and filename in headers:
 *   - `x-upload-path` : URL-encoded target directory path
 *   - `x-upload-name` : URL-encoded filename
 *   - `content-type`  : the file's MIME type
 *
 * Reading the raw body and handing it straight to the repository avoids the
 * multipart parse + Blob/arrayBuffer copy chain, which copied the file ~3-4×
 * in memory and OOMed the Cloudflare Worker isolate (128 MB) around 80 MB.
 *
 * Upload size is bounded by the platform request-body limit (~100 MB on
 * Cloudflare). pCloud has no OAuth2-compatible chunked/resumable upload API
 * (fileops returns 2003 Access denied), so a single request is the only option.
 */

import type { H3Event } from 'h3'
import { toItemDto } from '~~/server/presenters/file-system.presenter'
import { toHttpError } from '~~/server/utils/http-error'
import { resolveRepository } from '~~/server/utils/repository.resolver'

function decodeHeader(event: H3Event, name: string): string | undefined {
  const raw = getHeader(event, name)
  return raw ? decodeURIComponent(raw) : undefined
}

export const uploadHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)

  const parentPath = decodeHeader(event, 'x-upload-path')
  if (!parentPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      message: 'Missing x-upload-path header',
    })
  }

  const name = decodeHeader(event, 'x-upload-name') ?? 'upload'
  const mimeType = getHeader(event, 'content-type') || 'application/octet-stream'

  const body = await readRawBody(event, false)
  if (!body?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      message: 'Empty request body',
    })
  }

  const fileData = body instanceof Uint8Array ? body : new Uint8Array(body)

  try {
    const uploaded = await repository.uploadFile(parentPath, fileData, name, mimeType)
    return toItemDto(uploaded)
  }
  catch (error) {
    throw toHttpError(error)
  }
})
