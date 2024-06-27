export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@vueuse/nuxt',
    'nuxt-module-eslint-config',
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

  runtimeConfig: {
    appClientSecret: '',
    public: {
      pcloudAuthUrl: 'https://my.pcloud.com/oauth2/authorize',
      appClientId: '',
      redirectUri: '',
    },
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
