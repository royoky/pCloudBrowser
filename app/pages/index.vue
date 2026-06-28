<script setup lang="ts">
const { loggedIn } = useUserSession()

const containerClass
  = 'h-[calc(100vh-var(--ui-header-height))] max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8'
</script>

<template>
  <div :class="containerClass">
    <AppFileExplorer v-if="loggedIn" />
    <AppLoginPrompt v-else />
  </div>
</template>
