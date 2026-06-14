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
 * Two feeding strategies depending on the runtime:
 *   - Cloudflare Workers: event.web.request.body (Web API ReadableStream)
 *   - Node.js dev server: req.pipe(bb) (Node.js streams)
 *
 * Upload size is bounded by the platform's request body limit
 * (~100 MB on Cloudflare Workers, no hard limit on Node.js).
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

function parseMultipart(
  contentType: string,
  source: ReadableStream<Uint8Array> | IncomingMessage,
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

    if (source instanceof ReadableStream) {
      // Cloudflare Workers: feed Web API stream chunk by chunk
      const reader = source.getReader()
      const pump = (): void => {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              bb.end()
              return
            }
            bb.write(value)
            pump()
          })
          .catch(reject)
      }
      pump()
    }
    else {
      // Node.js dev server: pipe IncomingMessage directly
      source.pipe(bb)
    }
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

  const source = event.web?.request?.body ?? event.node.req

  const { parentPath, name, mimeType, fileData } = await parseMultipart(contentType, source)

  try {
    const file = await repository.uploadFile(parentPath, fileData, name, mimeType)
    return toItemDto(file)
  }
  catch (error) {
    throw toHttpError(error)
  }
})
