export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  // Get the request headers to construct the redirect URI dynamically
  const headers = getHeaders(event)
  const host = getRequestHost(event)
  const protocol = headers['x-forwarded-proto'] || 'http'
  const baseUrl = `${protocol}://${host}`

  const redirectUri = `${baseUrl}/api/pcloud/auth/callback`

  // Build the pCloud authorization URL
  const pcloudAuthUrl = new URL('https://my.pcloud.com/oauth2/authorize')
  pcloudAuthUrl.searchParams.set('client_id', config.appClientId)
  pcloudAuthUrl.searchParams.set('response_type', 'code')
  pcloudAuthUrl.searchParams.set('redirect_uri', redirectUri)

  await sendRedirect(event, pcloudAuthUrl.toString())
})
