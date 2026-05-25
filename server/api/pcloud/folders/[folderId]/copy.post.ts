// server/api/pcloud/folders/[folderId]/copy.post.ts
import type { H3Event } from 'h3'
import type { PCloudCopyFolderResponse } from '~~/server/models/pcloud-api'
import { z } from 'zod'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { mapPCloudFolderToCloudFolder } from '~~/server/mappers/pcloud-mapper'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

// pCloud copyfolder API: https://docs.pcloud.com/methods/folder/copyfolder.html
const copyFolderBodySchema = z.object({
  targetFolderId: z.string().describe('Destination folder ID'),
  newName: z
    .string()
    .optional()
    .describe('New name for the copied folder (not supported by pCloud, for API consistency)'),
  allowOverwrite: z.coerce
    .boolean()
    .optional()
    .default(false)
    .describe('Allow overwriting existing files'),
  skipExisting: z.coerce.boolean().optional().default(false).describe('Skip existing files'),
  copyContentOnly: z.coerce
    .boolean()
    .optional()
    .default(false)
    .describe('Copy content only (no folder structure)'),
})

function getHttpStatusCode(pcloudResult: number): number {
  switch (pcloudResult) {
    case 1000: // Log in required
    case 2000: // Log in failed
      return 401
    case 2001: // Invalid file/folder name
      return 400
    case 2003: // Access denied
      return 403
    case 2004: // Already exists
      return 409
    case 2005: // Directory does not exist
      return 404
    case 2008: // User over quota
      return 402
    case 2023: // Shared folder conflict
      return 403
    case 2206: // Can't copy folder into itself
    case 2207: // Can't copy folder to subfolder of itself
      return 400
    case 2208: // Target folder does not exist
      return 404
    case 2041: // Connection broken
      return 503
    case 4000: // Too many login tries
      return 429
    default:
      return 500
  }
}

function createPCloudError(response: any, defaultMsg: string) {
  return createError({
    statusCode: getHttpStatusCode(response.result),
    message: getPCloudErrorMessage(response) || defaultMsg,
  })
}

export default defineEventHandler(async (event: H3Event) => {
  const folderId = event.context?.params?.folderId
  const baseUrl = event.context.auth.hostname
  const token = event.context.auth.token

  if (!folderId || !baseUrl || !token) {
    throw createError({ statusCode: 400, message: 'Invalid folder ID or missing auth' })
  }

  // Ensure folderId is cast to a number for pCloud
  const folderIdNum = Number(folderId)
  if (Number.isNaN(folderIdNum)) {
    throw createError({ statusCode: 400, message: 'Folder ID must be a valid number' })
  }

  const { targetFolderId, allowOverwrite, skipExisting, copyContentOnly } = await readValidatedBody(
    event,
    copyFolderBodySchema.parse,
  )

  const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.COPY_FOLDER}`
  const headers = { authorization: `Bearer ${token}` }

  // pCloud copyfolder does NOT support toname parameter.
  // The folder will keep its original name.
  // Use tofolderid to specify destination folder.
  // allowOverwrite controls noover: 0 = allow, 1 = prevent overwrite
  const params: Record<string, string | number | undefined> = {
    folderid: folderIdNum,
    tofolderid: Number(targetFolderId),
    noover: allowOverwrite ? 0 : 1,
    skipexisting: skipExisting ? 1 : undefined,
    copycontentonly: copyContentOnly ? 1 : undefined,
  }

  const response = await $fetch<PCloudCopyFolderResponse>(url, {
    method: 'GET',
    params,
    headers,
  })

  if (!isPCloudSuccess(response))
    throw createPCloudError(response, 'Failed to copy folder')

  return mapPCloudFolderToCloudFolder(response.metadata)
})
