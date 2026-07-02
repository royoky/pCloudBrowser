export default defineEventHandler(async (event) => {
  let session: Awaited<ReturnType<typeof getUserSession>>
  try {
    session = await getUserSession(event)
  }
  catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'SERVICE_UNAVAILABLE',
      message: 'Server misconfiguration — check environment variables (NUXT_SESSION_PASSWORD)',
    })
  }
  const token = session.pcloudAccessToken
  const hostname = session.pcloudApiHostname

  if (event.path.includes('/api/')) {
    if (event.path.includes('/auth')) {
      event.context.auth = { hostname }
    }
    else if (!token) {
      throw createError({
        statusCode: 403,
        statusMessage: 'User is not logged in',
      })
    }
    event.context.auth = { token, hostname }
  }
})
