import type {
  PCloudTokenResponse,
  PCloudUserInfo,
} from '~~/server/models/pcloud-api'
import {
  getPCloudErrorMessage,
  isPCloudSuccess,
} from '~~/server/models/pcloud-api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)

  const code = query.code as string
  const hostname = query.hostname as string

  if (!code || !hostname) {
    throw createError({
      statusCode: 400,
      message: 'Invalid pCloud callback: missing code or hostname',
    })
  }

  try {
    const tokenUrl = `https://${hostname}/oauth2_token`
    const tokenResponse = await $fetch<PCloudTokenResponse>(tokenUrl, {
      method: 'POST',
      params: {
        client_id: config.appClientId,
        client_secret: config.appClientSecret,
        code,
      },
    })

    if (!isPCloudSuccess(tokenResponse)) {
      const errorMessage
        = getPCloudErrorMessage(tokenResponse)
          || 'Unknown pCloud token exchange error'
      throw new Error(`pCloud token exchange failed: ${errorMessage}`)
    }

    const accessToken = tokenResponse.access_token
    if (!accessToken) {
      throw new Error('Failed to get access token from successful response')
    }

    const userUrl = `https://${hostname}/userinfo`
    const pcloudUserInfo = await $fetch<PCloudUserInfo>(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!isPCloudSuccess(pcloudUserInfo)) {
      const errorMessage
        = getPCloudErrorMessage(pcloudUserInfo)
          || 'Unknown error fetching user info'
      throw new Error(`Failed to fetch user info: ${errorMessage}`)
    }

    await setUserSession(event, {
      user: {
        pcloudId: tokenResponse.uid,
        email: pcloudUserInfo.email,
        emailVerified: pcloudUserInfo.emailverified,
        registered: pcloudUserInfo.registered,
        premium: pcloudUserInfo.premium,
        premiumexpires: pcloudUserInfo.premiumexpires,
        quota: pcloudUserInfo.quota,
        usedquota: pcloudUserInfo.usedquota,
        language: pcloudUserInfo.language,
      },
      pcloudAccessToken: accessToken,
      pcloudApiHostname: hostname,
    })

    return sendRedirect(event, '/')
  }
  catch (error) {
    const typedError = error as Error
    console.error('Error in pCloud auth callback:', typedError)
    throw createError({
      statusCode: 500,
      message: typedError.message ?? 'Internal Server Error during pCloud auth',
    })
  }
})
