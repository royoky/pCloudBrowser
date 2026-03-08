// server/api/pcloud/files/upload.post.ts
import type { H3Event } from 'h3'
import type { PCloudUploadFileResponse } from '~~/server/models/pcloud-api'
import { z } from 'zod'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { mapPCloudFileToCloudFile } from '~~/server/mappers/pcloud-mapper'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

const uploadFileBodySchema = z.object({
  folderId: z.number(),
  file: z.instanceof(File), // For browser uploads
  filename: z.string().optional(),
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
    case 2005: // Directory does not exist
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
    case 2004: // File/Folder already exists
      return 409 // Conflict
    default:
      return 500 // Internal/Unknown
  }
}

export default defineEventHandler(async (event: H3Event) => {
  const baseUrl = event.context?.auth?.hostname
  const token = event.context?.auth?.token
  
  if (!baseUrl || !token) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  try {
    const body = await readValidatedBody(event, uploadFileBodySchema.parse)
    const headers = { authorization: `Bearer ${token}` }
    
    // Prepare form data for pCloud upload API
    const formData = new FormData()
    formData.append('file', body.file)
    formData.append('folderid', body.folderId.toString())
    if (body.filename) {
      formData.append('filename', body.filename)
    }

    const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.UPLOAD}`
    const response = await $fetch<PCloudUploadFileResponse>(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!isPCloudSuccess(response)) {
      throw createError({
        statusCode: getHttpStatusCode(response.result),
        message: getPCloudErrorMessage(response) || 'File upload failed',
      })
    }

    // Return cloud-agnostic file data
    const currentPath = `/${body.file.name}`
    return mapPCloudFileToCloudFile(response.metadata, currentPath)
    
  } catch (error) {
    const typedError = error as Error
    console.error('Error in file upload:', typedError)
    throw createError({
      statusCode: 500,
      message: typedError.message || 'Internal Server Error during file upload',
    })
  }
})