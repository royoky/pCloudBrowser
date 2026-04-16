// server/api/pcloud/files/[fileId].ts
import type { H3Event } from 'h3'
import type {
  PCloudCopyFileResponse,
  PCloudDeleteFileResponse,
  PCloudFileLinkResponse,
  PCloudRenameFileResponse,
} from '~~/server/models/pcloud-api'
import { z } from 'zod'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { mapPCloudFileToCloudFile } from '~~/server/mappers/pcloud-mapper'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

// Use z.coerce to turn strings ("true", "1") into real booleans
const downloadParamsSchema = z.object({
  forcedownload: z.coerce.boolean().optional().default(false),
  proxy: z.coerce.boolean().optional().default(false),
})

const copyBodySchema = z.object({
  targetFolderId: z.string(),
  newName: z.string().optional(),
})

const renameBodySchema = z.object({
  newName: z.string().optional(),
  targetFolderId: z.string().optional(),
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
  const fileIdParam = event.context?.params?.fileId
  const baseUrl = event.context?.auth?.hostname
  const token = event.context?.auth?.token

  if (!fileIdParam || !baseUrl || !token) {
    throw createError({ statusCode: 400, message: 'Invalid file ID or missing auth' })
  }

  // Ensure fileId is cast to a number for pCloud
  const fileId = Number(fileIdParam)
  const baseParams = { fileid: fileId }
  const headers = { authorization: `Bearer ${token}` }

  switch (event.method) {
    case 'GET': {
      const query = getQuery(event)
      const params = downloadParamsSchema.parse(query)

      // 1. Get the link from pCloud
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DOWNLOAD}`
      const pcloudLinkResponse = await $fetch<PCloudFileLinkResponse>(url, {
        params: {
          fileid: fileId,
          forcedownload: params.forcedownload ? 1 : 0,
        },
        headers,
      })

      if (!isPCloudSuccess(pcloudLinkResponse)) {
        throw createPCloudError(pcloudLinkResponse, 'Failed to get file download link')
      }

      const directDownloadUrl = `https://${pcloudLinkResponse.hosts[0]}${pcloudLinkResponse.path}`

      // 2. If the frontend wants the JSON link, return it early
      if (!params.proxy) {
        return {
          downloadUrl: directDownloadUrl,
          expires: pcloudLinkResponse.expires,
        }
      }

      // 3. If proxy=true, stream the file through the Nuxt server
      // We use the native native 'fetch' API here so we can access the raw ReadableStream body
      const fileStreamResponse = await fetch(directDownloadUrl)

      if (!fileStreamResponse.ok || !fileStreamResponse.body) {
        throw createError({
          statusCode: 502,
          message: 'Failed to proxy file from storage provider',
        })
      }

      // 4. Pass pCloud's headers (Content-Type, Content-Length, Content-Disposition)
      // straight through to the Nuxt client so the browser knows what the file is
      for (const [key, value] of fileStreamResponse.headers.entries()) {
        setResponseHeader(event, key, value)
      }

      // 5. Stream the raw bytes to the client
      return sendStream(event, fileStreamResponse.body)
    }

    case 'DELETE': {
      // Deleting a file doesn't require extra params, just the fileid
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DELETE_FILE}`
      const response = await $fetch<PCloudDeleteFileResponse>(url, {
        params: baseParams,
        headers,
      })

      if (!isPCloudSuccess(response))
        throw createPCloudError(response, 'Failed to delete file')

      return { success: true }
    }

    case 'PATCH': {
      const body = await readValidatedBody(event, renameBodySchema.parse)
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.MOVE}`
      // Map generic names to pCloud-specific names
      const params = {
        ...baseParams,
        ...(body.newName && { toname: body.newName }),
        ...(body.targetFolderId && { tofolderid: Number(body.targetFolderId) }),
      }
      const response = await $fetch<PCloudRenameFileResponse>(url, {
        params,
        headers,
      })

      if (!isPCloudSuccess(response))
        throw createPCloudError(response, 'Failed to rename file')

      return mapPCloudFileToCloudFile(response.metadata, '/')
    }

    case 'POST': {
      const body = await readValidatedBody(event, copyBodySchema.parse)
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.COPY}`
      // Map generic names to pCloud-specific names
      const params = {
        ...baseParams,
        tofolderid: Number(body.targetFolderId),
        ...(body.newName && { toname: body.newName }),
      }
      const response = await $fetch<PCloudCopyFileResponse>(url, {
        params,
        headers,
      })

      if (!isPCloudSuccess(response))
        throw createPCloudError(response, 'Failed to copy file')

      return mapPCloudFileToCloudFile(response.metadata, '/')
    }

    default:
      throw createError({ statusCode: 405, message: 'Method not allowed' })
  }
})
