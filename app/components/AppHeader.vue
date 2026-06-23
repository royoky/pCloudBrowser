<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

// Custom color-mode toggle instead of <UColorModeButton />.
// That button swaps its sun/moon icons purely via CSS
// (`hidden dark:inline-block`), which VueFinder's global, unlayered
// `.hidden { display: none }` clobbers — leaving the moon stuck hidden.
// Driving a single icon from JS sidesteps that cascade entirely.
// We use @nuxtjs/color-mode's useColorMode() (the same state Nuxt UI relies
// on), not VueUse's, to avoid running two competing color-mode systems.
const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
  },
})

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
      <ClientOnly>
        <UButton
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="neutral"
          variant="ghost"
          :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
          @click="isDark = !isDark"
        />
        <template #fallback>
          <UButton color="neutral" variant="ghost" disabled icon="i-lucide-sun" />
        </template>
      </ClientOnly>

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
