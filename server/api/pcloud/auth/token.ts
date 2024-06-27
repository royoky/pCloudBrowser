import type { H3Event } from 'h3'
import type { OAuthToken } from '~/models/api-return-types'

export default defineEventHandler(async (event: H3Event) => {
  const baseUrl = event.context.auth.hostname
  const code = getQuery(event).code

  const config = useRuntimeConfig()

  const oAuthToken = await $fetch<OAuthToken>(
        `https://${baseUrl}/oauth2_token`,
        {
          params: {
            client_id: config.public.appClientId,
            client_secret: config.appClientSecret,
            code,
          },
        },
  )
  if (oAuthToken.result === 0)
    return oAuthToken
  else
    throw new Error(`cannot get token :: code ${oAuthToken.result} - ${oAuthToken.error}`)
})
