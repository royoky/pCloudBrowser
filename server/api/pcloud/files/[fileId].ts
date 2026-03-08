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

const downloadParamsSchema = z.object({
  forcedownload: z.boolean().optional().default(false),
})

const deleteParamsSchema = z.object({
  recursive: z.boolean().optional().default(false),
})

const copyBodySchema = z.object({
  tofolderid: z.number(),
  toname: z.string().optional(),
})

const renameBodySchema = z.object({
  toname: z.string(),
})

// Helper to map pCloud errors to proper HTTP status codes
function getHttpStatusCode(pcloudResult: number): number {
  switch (pcloudResult) {
    case 1000: // Log in required
    case 2000: // Log in failed
      return 401 // Unauthorized
    case 2001: // Invalid file/folder name
      return 400 // Bad request
    case 2003: // Access denied
      return 403 // Forbidden
    case 2005: // File does not exist
      return 404 // Not found
    case 2008: // User is over quota
      return 402 // Payment required
    case 2041: // Connection broken
      return 503 // Service unavailable
    case 4000: // Too many login tries from this IP
      return 429 // Too many requests
    case 5000: // Internal error
    case 5001: // Internal upload error
      return 500 // Internal server error
    case 2004: // File already exists
      return 409 // Conflict
    default:
      return 500 // Internal/Unknown
  }
}

export default defineEventHandler(async (event: H3Event) => {
  const fileId = event.context?.params?.fileId
  const baseUrl = event.context?.auth?.hostname
  const token = event.context?.auth?.token

  if (!fileId || !baseUrl || !token) {
    throw createError({
      statusCode: 400,
      message: 'Invalid file ID or authentication required',
    })
  }

  const baseParams = { fileid: fileId }
  const headers = { authorization: `Bearer ${token}` }

  switch (event.method) {
    case 'GET': {
      // Get file download link
      const query = getQuery(event)
      const params = downloadParamsSchema.parse(query)

      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DOWNLOAD}`
      const response = await $fetch<PCloudFileLinkResponse>(url, {
        params: { ...baseParams, ...params },
        headers,
      })

      if (!isPCloudSuccess(response)) {
        throw createError({
          statusCode: getHttpStatusCode(response.result),
          message: getPCloudErrorMessage(response) || 'Failed to get file download link',
        })
      }

      // Return download URL to frontend
      return {
        downloadUrl: `${response.ssl ? 'https' : 'http'}://${response.host}${response.path}`,
        expires: response.expires,
      }
    }

    case 'DELETE': {
      // Delete file
      const query = getQuery(event)
      const params = deleteParamsSchema.parse(query)

      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DELETE}`
      const response = await $fetch<PCloudDeleteFileResponse>(url, {
        params: { ...baseParams, ...params },
        headers,
      })

      if (!isPCloudSuccess(response)) {
        throw createError({
          statusCode: getHttpStatusCode(response.result),
          message: getPCloudErrorMessage(response) || 'Failed to delete file',
        })
      }

      return {
        success: true,
        deletedCount: response.deletedfiles || 0,
      }
    }

    case 'PATCH': {
      // Rename file
      const body = await readValidatedBody(event, renameBodySchema.parse)
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.MOVE}`
      const response = await $fetch<PCloudRenameFileResponse>(url, {
        params: { ...baseParams, ...body },
        headers,
      })

      if (!isPCloudSuccess(response)) {
        throw createError({
          statusCode: getHttpStatusCode(response.result),
          message: getPCloudErrorMessage(response) || 'Failed to rename file',
        })
      }

      // Return updated file metadata
      return mapPCloudFileToCloudFile(response.metadata, '/')
    }

    case 'POST': {
      // Copy file
      const body = await readValidatedBody(event, copyBodySchema.parse)
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.COPY}`
      const response = await $fetch<PCloudCopyFileResponse>(url, {
        params: { ...baseParams, ...body },
        headers,
      })

      if (!isPCloudSuccess(response)) {
        throw createError({
          statusCode: getHttpStatusCode(response.result),
          message: getPCloudErrorMessage(response) || 'Failed to copy file',
        })
      }

      // Return copied file metadata
      return mapPCloudFileToCloudFile(response.metadata, '/')
    }

    default:
      throw createError({ statusCode: 405, message: 'Method not allowed' })
  }
})
