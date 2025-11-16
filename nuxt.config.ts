export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    ['vuetify-nuxt-module', {
      moduleOptions: {
        prefersColorScheme: true,
        prefersColorSchemeOptions: {
          cookieName: 'vuetify-theme',
        },
      },
      vuetifyOptions: './vuetify.config.ts',
    }],
    'nuxt-auth-utils',
  ],

  runtimeConfig: {
    pcloudClientSecret: '',
    pcloudClientId: '',
    public: {
      baseUrl: '',
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
