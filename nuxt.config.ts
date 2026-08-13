export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@nuxt/ui',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    appClientIdFull: '',
    appClientSecretFull: '',
    appClientIdAppFolder: '',
    appClientSecretAppFolder: '',
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  nitro: {
    preset: 'cloudflare_module',
    experimental: {
      openAPI: true,
    },
  },
})
