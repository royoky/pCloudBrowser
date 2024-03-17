<script setup lang="ts">
import { useTheme } from 'vuetify'

useHead({
  title: 'pCloud Browser',
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/favicon-32x32.ico',
    },
  ],
})

const theme = useTheme()

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>

<template>
  <div>
    <VApp>
      <VLayout>
        <AppMenu />
        <VAppBar name="App Bar">
          <VAppBarTitle>
            <div class="app-bar-title" href="/">
              pCloud Browser
            </div>
          </VAppBarTitle>
          <VBtn icon @click="toggleTheme">
            <VIcon>mdi-theme-light-dark</VIcon>
          </VBtn>
        </VAppBar>
        <VBottomNavigation class="align-center">
          <div>FOOTER</div>
        </VBottomNavigation>
        <VMain>
          <NuxtPage />
        </VMain>
      </VLayout>
    </VApp>
  </div>
</template>
