// server/api/pcloud/files/upload.post.ts
import type { H3Event } from 'h3'
import type { PCloudUploadResponse } from '~~/server/models/pcloud-api'
import { readMultipartFormData } from 'h3'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

// Type for the upload response that we return to the frontend
export interface UploadResponse {
  success: boolean
  fileId: number
  metadata: any // Could be more specific if needed
}

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
    // Parse multipart form data
    const multipartData = await readMultipartFormData(event)

    if (!multipartData) {
      throw createError({
        statusCode: 400,
        message: 'No multipart form data received',
      })
    }

    // Extract fields and file from multipart data
    const folderId = multipartData.find(part => part.name === 'folderId')?.data?.toString()
    const filename = multipartData.find(part => part.name === 'filename')?.data?.toString()
    const contentType = multipartData.find(part => part.name === 'contentType')?.data?.toString()
    const nopartial
      = multipartData.find(part => part.name === 'nopartial')?.data?.toString() === 'true'
    const filePart = multipartData.find(part => part.name === 'file')

    if (!folderId || !filename || !filePart) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields in multipart form data',
      })
    }

    // Validate folderId is a number
    const folderIdNum = Number.parseInt(folderId, 10)
    if (Number.isNaN(folderIdNum)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid folderId - must be a number',
      })
    }

    const fileData = filePart.data

    if (!fileData || fileData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file data received',
      })
    }

    // Upload to pCloud using the uploadfile endpoint
    const pcloudUrl = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.UPLOAD}`

    // Create FormData for the upload
    const formData = new FormData()

    // Add parameters first (as per pCloud requirements)
    formData.append('folderid', folderIdNum.toString())
    formData.append('nopartial', nopartial ? '1' : '0')

    if (contentType) {
      formData.append('contenttype', contentType)
    }

    // Add the file data with filename
    formData.append('file', new Blob([fileData]), filename)

    // Use native fetch to properly handle multipart/form-data
    const pcloudResponse = await fetch(pcloudUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!pcloudResponse.ok) {
      throw createError({
        statusCode: pcloudResponse.status,
        message: `pCloud upload failed with status ${pcloudResponse.status}`,
      })
    }

    const response = (await pcloudResponse.json()) as PCloudUploadResponse

    if (!isPCloudSuccess(response)) {
      throw createError({
        statusCode: getHttpStatusCode(response.result),
        message: getPCloudErrorMessage(response) || 'Failed to upload file',
      })
    }

    // Validate response structure
    if (!response.fileids || response.fileids.length === 0) {
      throw createError({
        statusCode: 500,
        message: 'Upload succeeded but no file IDs returned',
      })
    }

    if (!response.metadata || response.metadata.length === 0) {
      throw createError({
        statusCode: 500,
        message: 'Upload succeeded but no metadata returned',
      })
    }

    // Return the uploaded file metadata
    return {
      success: true,
      fileId: response.fileids[0],
      metadata: response.metadata[0],
    }
  }
  catch (error) {
    const typedError = error as Error
    console.error('Error uploading file:', typedError)
    throw createError({
      statusCode: 500,
      message: typedError.message || 'Internal Server Error uploading file',
    })
  }
})
