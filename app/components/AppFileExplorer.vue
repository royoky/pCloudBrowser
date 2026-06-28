<script setup lang="ts">
import type { ConfigDefaults } from 'vuefinder'

const { $vueFinderDriver: driver } = useNuxtApp()
const colorMode = useColorMode()

const vueFinderConfig = computed<ConfigDefaults>(() => ({
  theme: colorMode.value === 'dark' ? 'midnight' : 'silver',
  view: 'grid',
  persist: true,
  maxFileSize: '1000mb',
}))

const features = {
  upload: true,
  download: true,
  rename: true,
  delete: true,
  copy: true,
  move: true,
  newfolder: true,
  newfile: true,
  edit: true,
  search: true,
  preview: true,
  archive: false,
  unarchive: false,
}

function handleError(_error: unknown) {
  // Error is handled by VueFinder's built-in error display
}

function handleReady() {
  // VueFinder is initialized and ready to use
}
</script>

<template>
  <ClientOnly>
    <div class="file-explorer">
      <VueFinder
        id="pcloud-browser"
        :driver
        :config="vueFinderConfig"
        :features
        selection-mode="multiple"
        @ready="handleReady"
        @error="handleError"
      />
    </div>
  </ClientOnly>
</template>

<style scoped>
.file-explorer {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.file-explorer :deep(.vue-finder) {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
