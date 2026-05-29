<script setup lang="ts">
import { VueFinder } from 'vuefinder';
import { useVueFinderDriver } from '~~/app/composables/useFileSystem';

const { loggedIn } = useUserSession();

// Get the VueFinder driver from our composable
const driver = useVueFinderDriver();

// Configuration for VueFinder
const vueFinderConfig = {
  // Theme settings
  theme: 'light', // Will be controlled by the app's color mode
  
  // View settings
  view: 'grid' as 'grid' | 'list', // Default view
  
  // Persist settings
  persist: true,
  
  // Available storages
  storages: ['pcloud'],
};

// Features configuration
const features = {
  // File operations
  upload: true,
  download: true,
  rename: true,
  delete: true,
  copy: true,
  move: true,
  
  // View options
  search: true,
  preview: true,
  
  // Disabled features
  edit: false, // File editing
  archive: false, // Creating archives
  unarchive: false, // Extracting archives
};

// Handle color mode changes
const colorMode = useColorMode();

// Watch for color mode changes and update VueFinder
watch(() => colorMode.value, (newMode) => {
  // VueFinder will automatically adapt to the app's CSS variables
  // which are controlled by Nuxt's color mode
}, { immediate: true });

// Handle errors from VueFinder
const handleError = (error: unknown) => {
  console.error('VueFinder error:', error);
  // TODO: Show error to user
};

// Handle ready event
const handleReady = () => {
  console.log('VueFinder is ready');
};
</script>

<template>
  <div class="file-explorer-container">
    <!-- VueFinder Component - only show when logged in -->
    <VueFinder
      v-if="loggedIn"
      id="pcloud-browser"
      :driver="driver"
      :config="vueFinderConfig"
      :features="features"
      selection-mode="multiple"
      @ready="handleReady"
      @error="handleError"
    />

    <!-- Login prompt for when user is not logged in -->
    <div v-else class="login-prompt">
      <a href="/auth/pcloud" class="login-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 6v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3Z" />
          <path d="M18 12h3" />
          <path d="M21 9v6" />
        </svg>
        <span>Login with pCloud</span>
      </a>
    </div>
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
