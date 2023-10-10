<template>
  <div>
    <v-app>
      <v-layout>
        <AppMenu></AppMenu>
        <v-app-bar name="App Bar">
          <VAppBarTitle
            ><div class="app-bar-title" :href="'/'">
              pCloud Browser
            </div></VAppBarTitle
          >
          <VBtn icon @click="toggleTheme">
            <VIcon>mdi-theme-light-dark</VIcon>
          </VBtn>
        </v-app-bar>
        <v-bottom-navigation class="align-center">
          <div>FOOTER</div>
        </v-bottom-navigation>
        <v-main>
          <NuxtPage />
        </v-main>
      </v-layout>
    </v-app>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "vuetify";

useHead({
  title: "pCloud Browser",
  link: [
    {
      rel: "icon",
      type: "image/png",
      href: "/favicon-32x32.ico",
    },
  ],
});

const theme = useTheme();

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
}
</script>
