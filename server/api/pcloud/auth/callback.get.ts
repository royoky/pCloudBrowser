import type { UserInfo } from '~/models/api-return-types'

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
    const tokenResponse = await $fetch<TokenResponse>(tokenUrl, {
      method: 'POST',
      params: {
        client_id: config.pcloudClientId,
        client_secret: config.pcloudClientSecret,
        code,
      },
    })

    const accessToken = tokenResponse.access_token
    if (!accessToken) {
      throw new Error('Failed to get access token')
    }

    const userUrl = `https://${hostname}/userinfo`
    const userInfo = await $fetch<UserInfo>(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    await setUserSession(event, {
      user: {
        pcloudId: tokenResponse.uid,
        email: userInfo.email,
        emailVerified: userInfo.emailverified,
        registered: userInfo.registered,
        premium: userInfo.premium,
        premiumexpires: userInfo.premiumexpires,
        quota: userInfo.quota,
        usedquota: userInfo.usedquota,
        language: userInfo.language,
      },
      pcloudAccessToken: accessToken,
      pcloudApiHostname: hostname,
    })

    return sendRedirect(event, '/')
  }
  catch (error) {
    console.error('Error in pCloud auth callback:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal Server Error during pCloud auth',
    })
  }
})

interface TokenResponse {
  result: number
  access_token: string
  token_type: string
  uid: number
}
