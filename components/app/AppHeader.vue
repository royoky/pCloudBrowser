<script setup lang="ts">
const theme = useTheme()

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const rail = useState<boolean>('rail')

const toggleDrawer = useToggle(rail)
</script>

<template>
  <VAppBar name="App Bar">
    <template #prepend>
      <VAppBarNavIcon @click="toggleDrawer()" />
    </template>
    <VAppBarTitle>
      <div class="app-bar-title" href="/">
        pCloud Browser
      </div>
    </VAppBarTitle>
    <VBtn icon @click="toggleTheme">
      <VIcon>mdi-theme-light-dark</VIcon>
    </VBtn>
  </VAppBar>
</template>
