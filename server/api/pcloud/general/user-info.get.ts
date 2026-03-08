import type { H3Event } from 'h3'
import type {
  PCloudUserInfo,
} from '~~/server/models/pcloud-api'
import { mapPCloudUserToCloudUser } from '~~/server/mappers/pcloud-mapper'
import {
  getPCloudErrorMessage,
  isPCloudSuccess,
} from '~~/server/models/pcloud-api'

export default defineEventHandler(async (event: H3Event) => {
  const headers = { authorization: `Bearer ${event.context.auth.token}` }
  const url = `https://${event.context.auth.hostname}/userinfo`

  const response = await $fetch<PCloudUserInfo>(url, {
    headers,
  })

  if (!isPCloudSuccess(response)) {
    const errorMessage
      = getPCloudErrorMessage(response) || 'Failed to fetch user info'
    throw createError({
      statusCode: 500,
      message: errorMessage,
    })
  }

  // Return cloud-agnostic user info
  return mapPCloudUserToCloudUser(response)
})
