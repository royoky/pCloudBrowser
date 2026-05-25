// server/api/pcloud/files/[fileId]/copy.post.ts
import type { H3Event } from 'h3'
import type { PCloudBaseResponse, PCloudCopyFileResponse } from '~~/server/models/pcloud-api'
import { z } from 'zod'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { mapPCloudFileToCloudFile } from '~~/server/mappers/pcloud-mapper'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

// pCloud copyfile API: https://docs.pcloud.com/methods/file/copyfile.html
const copyFileBodySchema = z.object({
  targetFolderId: z.string().describe('Destination folder ID'),
  newName: z.string().optional().describe('New name for the copied file'),
  allowOverwrite: z.coerce
    .boolean()
    .optional()
    .default(false)
    .describe('Allow overwriting existing file'),
})

function getHttpStatusCode(pcloudResult: number): number {
  switch (pcloudResult) {
    case 1000: // Log in required
    case 2000: // Log in failed
      return 401
    case 1004: // No fileid or path provided
    case 1016: // No full topath or toname/tofolderid provided
      return 400
    case 2001: // Invalid file/folder name
      return 400
    case 2002: // A component of parent directory does not exist
      return 404
    case 2003: // Access denied
      return 403
    case 2004: // File already exists
      return 409
    case 2008: // User over quota
      return 402
    case 2009: // File not found
    case 2010: // Invalid path
      return 404
    case 4000: // Too many login tries
      return 429
    default:
      return 500
  }
}

function createPCloudError(response: PCloudBaseResponse, defaultMsg: string) {
  return createError({
    statusCode: getHttpStatusCode(response.result),
    message: getPCloudErrorMessage(response) || defaultMsg,
  })
}

export default defineEventHandler(async (event: H3Event) => {
  const fileId = event.context?.params?.fileId
  const baseUrl = event.context.auth.hostname
  const token = event.context.auth.token

  if (!fileId || !baseUrl || !token) {
    throw createError({ statusCode: 400, message: 'Invalid file ID or missing auth' })
  }

  // Ensure fileId is cast to a number for pCloud
  const fileIdNum = Number(fileId)
  if (Number.isNaN(fileIdNum)) {
    throw createError({ statusCode: 400, message: 'File ID must be a valid number' })
  }

  const { targetFolderId, newName, allowOverwrite } = await readValidatedBody(
    event,
    copyFileBodySchema.parse,
  )

  const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.COPY_FILE}`
  const headers = { authorization: `Bearer ${token}` }

  // pCloud expects parameters as query params for copyfile
  // Map generic names to pCloud-specific names
  // pCloud copyfile supports tofolderid + toname for move and rename
  // Note: Auto-rename is disabled. When allowOverwrite=false (default, noover=1),
  // pCloud returns error 2004 if file already exists. This will be handled
  // in a future branch to show Skip/Overwrite dialog to user.
  const params: Record<string, string | number | undefined> = {
    fileid: fileIdNum,
    tofolderid: Number(targetFolderId),
    noover: allowOverwrite ? 0 : 1, // pCloud: noover=1 means do not overwrite
    ...(newName && { toname: newName }),
  }

  const response = await $fetch<PCloudCopyFileResponse>(url, {
    method: 'GET', // pCloud uses GET for copyfile
    params,
    headers,
  })

  if (!isPCloudSuccess(response))
    throw createPCloudError(response, 'Failed to copy file')

  return mapPCloudFileToCloudFile(response.metadata)
})
