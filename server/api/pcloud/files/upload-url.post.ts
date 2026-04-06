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
    const { folderId, contentType, size, nopartial } = await readValidatedBody(
      event,
      uploadRequestSchema.parse,
    )

    const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.UPLOAD_LINK}`
    const response = await $fetch<PCloudUploadUrlResponse>(url, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
      params: {
        folderid: folderId,
        comment: 'Direct upload from pCloud Browser',
        ...(contentType && { contenttype: contentType }),
        ...(size && { size }),
        nopartial: nopartial ? 1 : 0,
      },
    })

    if (!isPCloudSuccess(response)) {
      throw createError({
        statusCode: getHttpStatusCode(response.result),
        message: getPCloudErrorMessage(response) || 'Failed to generate upload URL',
      })
    }

    const uploadUrl = `https://${baseUrl}/uploadtolink?code=${response.code}`

    return {
      uploadUrl,
      method: 'POST',
      headers: {},
      expires: null,
      fileId: null,
      uploadCode: response.code,
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
