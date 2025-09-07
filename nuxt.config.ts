export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

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

  runtimeConfig: {
    appClientSecret: '',
    public: {
      pcloudAuthUrl: 'https://my.pcloud.com/oauth2/authorize',
      appClientId: '',
      redirectUri: '',
    },
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
