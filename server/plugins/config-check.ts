import process from 'node:process'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const missing: string[] = []

  if (!process.env.NUXT_SESSION_PASSWORD)
    missing.push('NUXT_SESSION_PASSWORD')
  if (!config.appClientId)
    missing.push('NUXT_APP_CLIENT_ID')
  if (!config.appClientSecret)
    missing.push('NUXT_APP_CLIENT_SECRET')

  if (missing.length) {
    console.error(
      `[config] Missing required environment variables: ${missing.join(', ')}. `
      + 'The application will not work correctly.',
    )
  }
})
