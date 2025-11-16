export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const redirectUri = `${config.public.baseUrl}/api/pcloud/auth/callback`

  // Build the pCloud authorization URL
  const pcloudAuthUrl = new URL('https://my.pcloud.com/oauth2/authorize')
  pcloudAuthUrl.searchParams.set('client_id', config.pcloudClientId)
  pcloudAuthUrl.searchParams.set('response_type', 'code')
  pcloudAuthUrl.searchParams.set('redirect_uri', redirectUri)

  await sendRedirect(event, pcloudAuthUrl.toString())
})
