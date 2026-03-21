// server/api/pcloud/files/upload.post.ts
import type { H3Event } from 'h3'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { mapPCloudFileToCloudFile } from '~~/server/mappers/pcloud-mapper'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

export default defineEventHandler(async (event: H3Event) => {
  const baseUrl = event.context?.auth?.hostname
  const token = event.context?.auth?.token

  if (!baseUrl || !token) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  // 1. Read the multipart form data from the incoming request
  const formDataParams = await readMultipartFormData(event)
  if (!formDataParams || formDataParams.length === 0) {
    throw createError({ statusCode: 400, message: 'No data provided in upload request' })
  }

  // 2. Prepare the outgoing FormData for pCloud
  const pcloudFormData = new FormData()

  // 3. Loop through the parsed Nitro form data and append it
  for (const item of formDataParams) {
    if (item.name === 'file' && item.filename) {
      // It's the actual file! Convert the Node Buffer into a standard web Blob
      const blob = new Blob([item.data], { type: item.type })
      pcloudFormData.append('file', blob, item.filename)
    }
    else if (item.name) {
      // It's a metadata field (like 'folderid' or 'nopartial')
      // Note: item.data is a Buffer, so we must toString() it
      pcloudFormData.append(item.name, item.data.toString('utf-8'))
    }
  }

  // Ensure the frontend actually sent a file
  if (!pcloudFormData.has('file')) {
    throw createError({ statusCode: 400, message: 'Missing "file" field in upload' })
  }

  // 4. Send it to pCloud!
  const url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.UPLOAD}`

  // Note: We do NOT manually set the 'Content-Type' header here.
  // $fetch automatically detects the FormData body and sets 'multipart/form-data'
  // along with the crucially important boundary string.
  const response = await $fetch<any>(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: pcloudFormData,
  })

  if (!isPCloudSuccess(response)) {
    throw createError({
      statusCode: 400, // You can reuse your getHttpStatusCode helper here
      message: getPCloudErrorMessage(response) || 'Upload to storage provider failed',
    })
  }

  // 5. Map the response
  // pCloud's uploadfile response returns an array of metadata objects (in case of batch uploads).
  // Even if we only uploaded one file, we grab it from the first index.
  const uploadedFileMetadata = response.metadata[0]

  return mapPCloudFileToCloudFile(uploadedFileMetadata, '/')
})
