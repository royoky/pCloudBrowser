<script setup lang="ts">
const { loggedIn } = usePCloudAccount()
</script>

<template>
  <UHeader>
    <template #title>
      PCloudBrowser
    </template>

    <template #right>
      <AppUserMenu v-if="loggedIn" />

      <UColorModeButton />

      <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/royoky/pCloudBrowser"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
        />
      </UTooltip>
    </template>
  </UHeader>
</template>
