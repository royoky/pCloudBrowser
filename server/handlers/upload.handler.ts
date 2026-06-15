/**
 * Resumable upload handlers — chunked upload via pCloud's upload-session API.
 *
 * The client (a custom Uppy uploader) drives three steps, each an independent
 * small request so nothing is bounded by the platform's request-body / memory
 * limit, and the session id survives across the stateless requests:
 *
 *   1. POST /api/{provider}/upload/create        -> { uploadId }
 *   2. PUT  /api/{provider}/upload/write?uploadId=&offset=   (raw chunk body)
 *   3. POST /api/{provider}/upload/save  { uploadId, path, name }  -> FileDto
 *
 * pCloud's documented one-shot `uploadfile` is capped by the request body
 * limit (~100 MB on Cloudflare); the upload-session API has no such cap.
 */

import type { CreateUploadResultDto } from '~~/shared/contracts/file-system.dto'
import { z } from 'zod'
import { toItemDto } from '~~/server/presenters/file-system.presenter'
import { toHttpError } from '~~/server/utils/http-error'
import { resolveRepository } from '~~/server/utils/repository.resolver'

const writeQuerySchema = z.object({
  uploadId: z.string().min(1),
  offset: z.coerce.number().int().min(0),
})

const saveBodySchema = z.object({
  uploadId: z.string().min(1),
  path: z.string().min(1),
  name: z.string().min(1),
})

/** POST /api/{provider}/upload/create */
export const createUploadHandler = defineEventHandler(
  async (event): Promise<CreateUploadResultDto> => {
    const repository = resolveRepository(event)
    try {
      return { uploadId: await repository.createUpload() }
    }
    catch (error) {
      throw toHttpError(error)
    }
  },
)

/** PUT /api/{provider}/upload/write?uploadId=&offset= — raw chunk body */
export const writeChunkHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const { uploadId, offset } = await getValidatedQuery(event, writeQuerySchema.parse)

  const body = await readRawBody(event, false)
  if (!body?.length) {
    throw createError({ statusCode: 400, statusMessage: 'BAD_REQUEST', message: 'Empty chunk' })
  }
  const data = body instanceof Uint8Array ? body : new Uint8Array(body)

  try {
    await repository.writeUploadChunk(uploadId, offset, data)
    return { ok: true }
  }
  catch (error) {
    throw toHttpError(error)
  }
})

/** POST /api/{provider}/upload/save  { uploadId, path, name } */
export const saveUploadHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const { uploadId, path, name } = await readValidatedBody(event, saveBodySchema.parse)

  try {
    return toItemDto(await repository.saveUpload(uploadId, path, name))
  }
  catch (error) {
    throw toHttpError(error)
  }
})
