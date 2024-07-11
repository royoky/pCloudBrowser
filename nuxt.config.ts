// https://v3.nuxtjs.org/api/configuration/nuxt.config
import process from 'node:process'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    [
      '@pinia/nuxt',
      {
        autoImports: ['defineStore'],
      },
    ],
    [
      'vuetify-nuxt-module',
      {
        moduleOptions: {
          prefersColorScheme: true,
          prefersColorSchemeOptions: {
            cookieName: 'vuetify-theme',
          },
        },
        vuetifyOptions: './vuetify.config.ts',
      },
    ],
  ],

  eslint: {
    config: {
      standalone: false,
    },
  },

  runtimeConfig: {
    appClientSecret: process.env.NUXT_APP_CLIENT_SECRET,
    public: {
      pcloudAuthUrl: process.env.NUXT_PUBLIC_PCLOUD_AUTH_URL,
      redirectUri: process.env.NUXT_PUBLIC_REDIRECT_URI,
      appClientId: process.env.NUXT_PUBLIC_APP_CLIENT_ID,
    },
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  compatibilityDate: '2024-07-11',
})
