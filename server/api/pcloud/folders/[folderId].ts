// server/api/[folderId].ts
import type { H3Event } from 'h3'
import type {
  PCloudCreateFolderResponse,
  PCloudDeleteFolderRecursiveResponse,
  PCloudListFolderResponse,
  PCloudRenameFolderResponse,
} from '~~/server/models/pcloud-api'
import { z } from 'zod'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import {
  mapPCloudFolderToCloudFolder,
  mapPCloudListToCloudFolder,
} from '~~/server/mappers/pcloud-mapper'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

const folderBodySchema = z.object({
  newName: z.string().optional(),
  targetFolderId: z.string().optional(),
})

// Helper to map pCloud errors to proper HTTP status codes
function getHttpStatusCode(pcloudResult: number): number {
  switch (pcloudResult) {
    case 1000:
    case 2000:
      return 401 // Unauthorized / Login failed
    case 2003:
      return 403 // Access denied
    case 2005:
      return 404 // Directory does not exist
    case 2004:
      return 409 // File/Folder already exists
    default:
      return 500 // Internal/Unknown
  }
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const folderId = event.context?.params?.folderId
  const baseUrl = event.context.auth.hostname
  const headers = { authorization: `Bearer ${event.context.auth.token}` }

  const baseParams = { folderid: folderId, ...query }

  switch (event.method) {
    case 'GET': {
      // Validate folderId parameter
      if (!folderId) {
        throw createError({
          statusCode: 400,
          message: 'Folder ID is required',
        })
      }

      // Ensure folderid is sent as a number (pCloud expects numeric folder IDs)
      const folderIdNum = Number(folderId)
      if (Number.isNaN(folderIdNum)) {
        throw createError({
          statusCode: 400,
          message: 'Folder ID must be a valid number',
        })
      }

      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.LIST}`
      const response = await $fetch<PCloudListFolderResponse>(url, {
        params: { folderid: folderIdNum, ...query },
        headers,
      })

      if (!isPCloudSuccess(response))
        throw createPCloudError(response)

      const currentPath = response.metadata?.path || '/'
      return mapPCloudListToCloudFolder(response, currentPath)
    }

    case 'POST': {
      // Create new folder
      const body = await readValidatedBody(event, folderBodySchema.parse)
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.CREATE_FOLDER}`
      // Map generic name to pCloud parameter
      const params = { ...baseParams, name: body.newName }
      const response = await $fetch<PCloudCreateFolderResponse>(url, {
        params,
        headers,
      })

      if (!isPCloudSuccess(response))
        throw createPCloudError(response)

      // Return agnostic folder data to the frontend
      return mapPCloudFolderToCloudFolder(response.metadata)
    }

    case 'PUT': {
      // Move/Rename folder
      const body = await readValidatedBody(event, folderBodySchema.parse)
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.MOVE_FOLDER}`
      // Map generic names to pCloud-specific names
      const params: Record<string, string | number | undefined> = {
        ...baseParams,
        ...(body.newName && { toname: body.newName }),
        ...(body.targetFolderId && { tofolderid: Number(body.targetFolderId) }),
      }
      const response = await $fetch<PCloudRenameFolderResponse>(url, {
        params,
        headers,
      })

      if (!isPCloudSuccess(response))
        throw createPCloudError(response)

      return mapPCloudFolderToCloudFolder(response.metadata)
    }

    case 'DELETE': {
      const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DELETE_FOLDER}`
      const response = await $fetch<PCloudDeleteFolderRecursiveResponse>(url, {
        params: baseParams,
        headers,
      })

      if (!isPCloudSuccess(response))
        throw createPCloudError(response)

      // Return a standard agnostic success response
      return {
        success: true,
        deletedCount: (response.deletedfiles || 0) + (response.deletedfolders || 0),
      }
    }

    default:
      throw createError({ statusCode: 405, message: 'Method not allowed' })
  }
})

// Helper function to keep the switch statement clean
function createPCloudError(response: any) {
  return createError({
    statusCode: getHttpStatusCode(response.result),
    message: getPCloudErrorMessage(response) || 'Folder operation failed',
  })
}
