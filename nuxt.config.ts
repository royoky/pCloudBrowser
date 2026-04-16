import { ssrClientHintsConfiguration } from 'virtual:vuetify-ssr-client-hints-configuration'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    ['vuetify-nuxt-module', {
      moduleOptions: {
        labComponents: ['VFileUpload'],
        ssrClientHintsConfiguration: {
          reloadOnFirstRequest: true,
          viewportSize: true,
          prefersColorScheme: true,
          prefersColorSchemeOptions: {
            useBrowserThemeOnly: false,
          },
        },
      },
      vuetifyOptions: './vuetify.config.ts',
    }],
    'nuxt-auth-utils',
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
})
