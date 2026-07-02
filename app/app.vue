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
</script>

<template>
  <UApp :toaster="{ position: 'top-center' }">
    <AppHeader />
    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
