// server/api/pcloud/folders/[folderId]/copy.post.ts
import type { H3Event } from 'h3'
import type { PCloudRenameFolderResponse } from '~~/server/models/pcloud-api'
import { z } from 'zod'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { mapPCloudFolderToCloudFolder } from '~~/server/mappers/pcloud-mapper'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

const copyFolderBodySchema = z.object({
  tofolderid: z.number(),
  toname: z.string().optional(),
  recursive: z.coerce.boolean().optional().default(true),
})

function getHttpStatusCode(pcloudResult: number): number {
  switch (pcloudResult) {
    case 1000:
    case 2000:
      return 401
    case 2001:
      return 400
    case 2003:
      return 403
    case 2004:
      return 409
    case 2005:
      return 404
    case 2008:
      return 402
    case 2041:
      return 503
    case 4000:
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

  const body = await readValidatedBody(event, copyFolderBodySchema.parse)
  const baseParams = { folderid: folderIdNum }
  const headers = { authorization: `Bearer ${token}` }

  const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.COPY_FOLDER}`
  const response = await $fetch<PCloudRenameFolderResponse>(url, {
    params: { ...baseParams, tofolderid: body.tofolderid, toname: body.toname },
    headers,
  })

  if (!isPCloudSuccess(response))
    throw createPCloudError(response, 'Failed to copy folder')

  return mapPCloudFolderToCloudFolder(response.metadata)
})
