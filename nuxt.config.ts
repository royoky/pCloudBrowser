export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],

  // VueFinder CSS - we import it in our layout instead
  // to have better control over when it's loaded
  css: [
    // VueFinder styles will be imported in app.vue or layout
  ],

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

  // Build configuration for VueFinder
  build: {
    // Transpile VueFinder for better compatibility
    transpile: ['vuefinder'],
  },
})
