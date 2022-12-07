import vuetify from "vite-plugin-vuetify";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    async (options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) =>
        // @ts-ignore
        config.plugins.push(vuetify())
      );
    },
    "@vueuse/nuxt",
    [
      "@pinia/nuxt",
      {
        autoImports: ["defineStore"],
      },
    ],
  ],
  css: ["vuetify/lib/styles/main.sass"],
  build: {
    transpile: ["vuetify"],
  },
  vite: {
    ssr: {
      noExternal: ["vuetify"],
    },
    define: {
      "process.env.DEBUG": false,
    },
  },
});
