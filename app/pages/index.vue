<script setup lang="ts">
import type { ConfigDefaults } from 'vuefinder'

const { loggedIn } = useUserSession()

// Driver and HLS setup are handled by plugins (vuefinder.client, vuefinder-hls.client).
const { $vueFinderDriver: driver } = useNuxtApp()

const colorMode = useColorMode()

const vueFinderConfig = computed<ConfigDefaults>(() => ({
  theme: colorMode.value === 'dark' ? 'midnight' : 'silver',
  view: 'grid',
  persist: true,
  // Raise Uppy's client-side size guard. The real ceiling is the platform's
  // request body limit (no hard limit on Node; ~100 MB on Workers).
  maxFileSize: '1000mb',
}))

const features = {
  // File operations
  upload: true,
  download: true,
  rename: true,
  delete: true,
  copy: true,
  move: true,

  // File creation
  createFolder: true, // Enable "New Folder" button
  createFile: true, // Enable "New File" button

  // File editing
  edit: true, // Enable "Save" for edited files

  // View options
  search: true,
  preview: true,

  // Disabled features
  archive: false, // Creating archives
  unarchive: false, // Extracting archives
}

// Handle errors from VueFinder
function handleError(_error: unknown) {
  // TODO: Show error to user
  // Error is handled by VueFinder's built-in error display
}

// Handle ready event
function handleReady() {
  // VueFinder is initialized and ready to use
}
</script>

<template>
  <div class="file-explorer-container">
    <!-- VueFinder Component - client-only due to browser dependencies -->
    <ClientOnly>
      <VueFinder
        v-if="loggedIn"
        id="pcloud-browser"
        :driver
        :config="vueFinderConfig"
        :features
        selection-mode="multiple"
        @ready="handleReady"
        @error="handleError"
      />

      <!-- Login prompt for when user is not logged in -->
      <div v-else class="login-prompt">
        <a href="/auth/pcloud" class="login-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 6v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3Z" />
            <path d="M18 12h3" />
            <path d="M21 9v6" />
          </svg>
          <span>Login with pCloud</span>
        </a>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.file-explorer-container {
  width: 100%;
  height: 100%;
  min-height: 0; /* Important for flexbox children */
}

.file-explorer-container :deep(.vue-finder) {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.login-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #1976d2;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.login-button:hover {
  background-color: #1565c0;
}

.login-button:active {
  transform: scale(0.98);
}

.login-button svg {
  width: 20px;
  height: 20px;
}
</style>
