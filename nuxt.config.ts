export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@nuxt/ui',
  ],

  // VueFinder CSS
  css: ['~/assets/css/main.css', 'vuefinder/dist/vuefinder.css'],

  runtimeConfig: {
    appClientSecret: '',
    appClientId: '',
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
