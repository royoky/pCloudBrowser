// server/api/pcloud/files/upload-url.post.ts
import type { H3Event } from 'h3'
import type { PCloudUploadUrlResponse } from '~~/server/models/pcloud-api'
import { z } from 'zod'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

const uploadRequestSchema = z.object({
  folderId: z.number(),
  filename: z.string(),
  contentType: z.string().optional(),
  size: z.number().optional(),
  nopartial: z.boolean().optional().default(true),
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
    case 2004: // File already exists
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
    // 1. Validate request (no file data needed!)
    const { folderId, filename, contentType, size, nopartial } = await readValidatedBody(
      event,
      uploadRequestSchema.parse,
    )

    // 2. Request a signed upload URL from pCloud
    const params = {
      folderid: folderId,
      filename,
      ...(contentType && { contenttype: contentType }),
      ...(size && { size }),
      nopartial: nopartial ? 1 : 0,
    }

    // Use the correct pCloud endpoint for creating upload links
    const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.UPLOAD_LINK}`
    const response = await $fetch<PCloudUploadUrlResponse>(url, {
      method: 'GET', // pCloud uses GET for createuploadlink
      headers: { authorization: `Bearer ${token}` },
      params,
    })

    if (!isPCloudSuccess(response)) {
      throw createError({
        statusCode: getHttpStatusCode(response.result),
        message: getPCloudErrorMessage(response) || 'Failed to generate upload URL',
      })
    }

    // 3. Construct the upload URL from pCloud's response
    // pCloud returns host + path + ssl flag, we need to assemble the full URL
    const uploadUrl = `${response.ssl ? 'https' : 'http'}://${response.host}${response.path}`

    return {
      uploadUrl,
      method: 'PUT', // pCloud upload links use PUT method
      headers: {}, // No additional headers needed for pCloud uploads
      expires: response.expiration,
      fileId: response.fileid,
    }
  }
  catch (error) {
    const typedError = error as Error
    console.error('Error generating upload URL:', typedError)
    throw createError({
      statusCode: 500,
      message: typedError.message || 'Internal Server Error generating upload URL',
    })
  }
})
