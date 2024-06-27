import type { OAuthToken } from '~/models/api-return-types'

export function authService() {
  const { public: env } = useRuntimeConfig()
  const clientId = env.appClientId

  function getAuthOptions() {
    const authUrl = env.pcloudAuthUrl
    const redirectUri = env.redirectUri

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
  ): Promise<OAuthToken> {
    return $fetch('/api/pcloud/auth/token', { params: { code } })
  }

  return {
    getAuthOptions,
    getTokenFromCode,
  }
}
