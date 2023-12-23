// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    "@vueuse/nuxt",
    [
      "@pinia/nuxt",
      {
        autoImports: ["defineStore"],
      },
    ],
    [
      "vuetify-nuxt-module",
      {
        moduleOptions: {
          prefersColorScheme: true,
          prefersColorSchemeOptions: {
            cookieName: "vuetify-theme",
          },
        },
        vuetifyOptions: "./vuetify.config.ts",
      },
    ],
  ],
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
});
