import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const headers = { authorization: `Bearer ${event.context.auth.token}` }
  const url = `https://${event.context.auth.hostname}/userinfo`
  return $fetch(url, {
    headers,
  })
})
