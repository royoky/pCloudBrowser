export default defineEventHandler((event) => {
  const token = getCookie(event, 'token')
  const hostname = getCookie(event, 'hostname')

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
