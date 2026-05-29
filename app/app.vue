<script setup lang="ts">
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

// Import VueFinder CSS
// We import it here so it's available globally
import 'vuefinder/dist/style.css'
</script>

<template>
  <div class="app-container">
    <AppHeader />
    <main class="main-content">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
/* Global styles for the application */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
