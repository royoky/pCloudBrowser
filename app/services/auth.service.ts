import type { OAuthToken } from '~/models/api-return-types'

export function authService() {
  const config = useRuntimeConfig()
  const clientId = config.public.appClientId

  function getAuthOptions() {
    const authUrl = 'https://my.pcloud.com/oauth2/authorize'
    const redirectUri = config.public.redirectUri

    return {
      authUrl,
      params: {
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
      },
    }
  }

  async function getTokenFromCode(
    code: string,
    hostname: string,
  ): Promise<OAuthToken> {
    const clientSecret = config.public.appClientSecret

    const oAuthToken = await $fetch<OAuthToken>(
      `https://${hostname}/oauth2_token`,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
      },
    )
    if (oAuthToken.result === 0)
      return oAuthToken
    else
      throw new Error(`cannot get token :: ${oAuthToken.result}`)
  }

  return {
    getAuthOptions,
    getTokenFromCode,
  }
}
