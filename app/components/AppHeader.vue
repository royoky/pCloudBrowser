<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { loggedIn, clear } = useUserSession()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Figma',
  icon: 'i-simple-icons-figma',
  to: 'https://go.nuxt.com/figma-ui',
  target: '_blank',
}, {
  label: 'Releases',
  icon: 'i-lucide-rocket',
  to: 'https://github.com/royoky/pCloudBrowser/releases',
  target: '_blank',
}])
</script>

<template>
  <UHeader toggle-side="left">
    <template #title>
      PCloudBrowser
    </template>

    <UNavigationMenu :items />

    <template #right>
      <UTooltip v-if="loggedIn" text="Logout">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          aria-label="Logout"
          @click="clear"
        />
      </UTooltip>

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

    <template #body>
      <UNavigationMenu :items orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
