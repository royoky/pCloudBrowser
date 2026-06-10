/**
 * Upload handler — POST /api/{provider}/upload
 *
 * Receives a multipart/form-data request from Uppy (VueFinder's uploader):
 *   - `file`  field: the file bytes
 *   - `path`  meta field: target directory path
 *
 * Uses busboy instead of H3's readMultipartFormData: the built-in parser has
 * an "Invalid array length" bug for bodies above ~10 MB. Busboy streams each
 * part independently and handles arbitrarily large files correctly.
 *
 * Upload size is still bounded by the platform's request body limit
 * (no hard limit on Node; ~100 MB on Cloudflare Workers).
 */

import type { IncomingMessage } from 'node:http'
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

function parseMultipart(req: IncomingMessage): Promise<ParsedUpload> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers })

    let parentPath: string | undefined
    let name: string | undefined
    let mimeType: string | undefined
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
        name: name!,
        mimeType: mimeType!,
        fileData: new Uint8Array(Buffer.concat(chunks)),
      })
    })

    bb.on('error', reject)
    req.pipe(bb)
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

  const { parentPath, name, mimeType, fileData } = await parseMultipart(event.node.req)

  try {
    const file = await repository.uploadFile(parentPath, fileData, name, mimeType)
    return toItemDto(file)
  }
  catch (error) {
    throw toHttpError(error)
  }
})
