<script setup lang="ts">
// Simple theme toggle using data attribute
const isDark = useState('theme-dark', () => false)

function toggleTheme() {
  isDark.value = !isDark.value
  // Update the HTML data-theme attribute
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme on client side
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme === 'dark'
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
})

// Save theme preference when it changes
watch(isDark, (newValue) => {
  localStorage.setItem('theme', newValue ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', newValue ? 'dark' : 'light')
})
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <NuxtLink to="/" class="app-logo">
        pCloud Browser
      </NuxtLink>
    </div>
    <div class="header-right">
      <button class="theme-toggle" @click="toggleTheme" :aria-label="`Toggle ${isDark ? 'light' : 'dark'} mode`">
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 64px;
  background-color: var(--background);
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
}

.app-logo {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  border-radius: 50%;
  transition: background-color 0.2s;
}

.theme-toggle:hover {
  background-color: var(--surface-hover);
}

.theme-toggle svg {
  width: 24px;
  height: 24px;
}
</style>
