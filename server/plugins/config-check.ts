import process from 'node:process'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const missing: string[] = []

  if (!process.env.NUXT_SESSION_PASSWORD)
    missing.push('NUXT_SESSION_PASSWORD')
  if (!config.appClientIdFull)
    missing.push('NUXT_APP_CLIENT_ID_FULL')
  if (!config.appClientSecretFull)
    missing.push('NUXT_APP_CLIENT_SECRET_FULL')
  if (!config.appClientIdAppFolder)
    missing.push('NUXT_APP_CLIENT_ID_APP_FOLDER')
  if (!config.appClientSecretAppFolder)
    missing.push('NUXT_APP_CLIENT_SECRET_APP_FOLDER')

  if (missing.length) {
    console.error(
      `[config] Missing required environment variables: ${missing.join(', ')}. `
      + 'The application will not work correctly.',
    )
  }
})
