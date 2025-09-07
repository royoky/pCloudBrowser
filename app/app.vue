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
  <div>
    <VApp>
      <VLayout>
        <AppHeader />
        <AppMenu />
        <VFooter app class="d-flex justify-center align-center">
          <div>App Footer</div>
        </VFooter>
        <VMain>
          <NuxtPage />
        </VMain>
      </VLayout>
    </VApp>
  </div>
</template>
