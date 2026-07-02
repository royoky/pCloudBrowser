<script setup lang="ts">
import type { ConfigDefaults, NotifyPayload } from 'vuefinder'

const { $vueFinderDriver: driver } = useNuxtApp()
const colorMode = useColorMode()

const vueFinderConfig = computed<ConfigDefaults>(() => ({
  theme: colorMode.value === 'dark' ? 'midnight' : 'silver',
  view: 'grid',
  persist: true,
  maxFileSize: '1000mb',
  // Disable VueFinder's built-in Sonner toasts; we render notifications
  // through Nuxt UI's useToast (via @notify) for a consistent look.
  notificationsEnabled: false,
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

const toast = useToast()

const NOTIFY_TITLES: Record<NotifyPayload['type'], string> = {
  success: 'Success',
  error: 'Error',
  info: 'Info',
  warning: 'Warning',
}

function handleNotify({ type, message }: NotifyPayload) {
  toast.add({ title: NOTIFY_TITLES[type], description: message, color: type })
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
        @notify="handleNotify"
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
