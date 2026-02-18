import type { H3Event } from 'h3'
import type {
  PCloudApiResponse,
  PCloudDeleteResponse,
  PCloudFolder,
  PCloudListResponse,
} from '~~/server/models/pcloud-api'
import { z } from 'zod'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import {
  getPCloudErrorMessage,
  isPCloudSuccess,
} from '~~/server/models/pcloud-api'

const createFolderBodySchema = z.object({ name: z.string() })

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const folderId = event.context?.params?.folderId
  const params = {
    folderid: folderId,
    ...query,
  }
  const baseUrl = event.context.auth.hostname
  const headers = { authorization: `Bearer ${event.context.auth.token}` }
  let url = ''
  let body

  // Type the response based on the HTTP method
  let response:
    | PCloudListResponse
    | PCloudApiResponse<PCloudFolder>
    | PCloudApiResponse<PCloudDeleteResponse>
    | PCloudApiResponse<unknown>

  switch (event.method) {
    case 'GET':
      url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.LIST}`
      response = await $fetch<PCloudListResponse>(url, { params, headers })
      break
    case 'POST':
      body = await readValidatedBody(event, createFolderBodySchema.parse)
      Object.assign(params, { name: body.name })
      url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.CREATE_FOLDER}`
      response = await $fetch<PCloudApiResponse<PCloudFolder>>(url, {
        params,
        headers,
      })
      break
    case 'PATCH':
      body = await readValidatedBody(event, createFolderBodySchema.parse)
      Object.assign(params, { toname: body.name })
      url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.MOVE}`
      response = await $fetch<PCloudApiResponse<PCloudFolder>>(url, {
        params,
        headers,
      })
      break
    case 'DELETE':
      url = `https://${baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DELETE}`
      // Add recursive parameter for deletefolderrecursive endpoint
      Object.assign(params, { recursive: 1 })
      response = await $fetch<PCloudDeleteResponse>(url, { params, headers })
      break
    default:
      throw createError({
        statusCode: 405,
        message: 'Method not allowed',
      })
  }

  if (!isPCloudSuccess(response)) {
    const errorMessage
      = getPCloudErrorMessage(response) || 'Folder operation failed'
    throw createError({
      statusCode: response.result === 2000 ? 404 : 500,
      message: errorMessage,
    })
  }

  return response
})
