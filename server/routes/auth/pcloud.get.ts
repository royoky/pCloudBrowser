export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const rawScope = getQuery(event).scope as string | undefined
  const scope: 'full' | 'appfolder' = rawScope === 'appfolder' ? 'appfolder' : 'full'
  const clientId = (
    scope === 'appfolder' ? config.appClientIdAppFolder : config.appClientIdFull
  ) as string

  const headers = getHeaders(event)
  const host = getRequestHost(event)
  const protocol = headers['x-forwarded-proto'] || 'http'
  const baseUrl = `${protocol}://${host}`

  const redirectUri = `${baseUrl}/api/pcloud/auth/callback`

  const pcloudAuthUrl = new URL('https://my.pcloud.com/oauth2/authorize')
  pcloudAuthUrl.searchParams.set('client_id', clientId)
  pcloudAuthUrl.searchParams.set('response_type', 'code')
  pcloudAuthUrl.searchParams.set('redirect_uri', redirectUri)
  pcloudAuthUrl.searchParams.set('state', scope)

  await sendRedirect(event, pcloudAuthUrl.toString())
})
