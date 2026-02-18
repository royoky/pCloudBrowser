<script setup lang="ts">
const { loggedIn } = useUserSession()
</script>

<template>
  <div
    class="d-flex justify-center pa-6 h-100"
    :class="[loggedIn ? 'align-top' : 'align-center']"
  >
    <div v-if="loggedIn" class="d-flex flex-column align-center">
      <AppFileExplorer />
    </div>

    <VBtn v-else class="text-none" append-icon="mdi-login" href="/auth/pcloud">
      <span>Login</span>
    </VBtn>
  </div>
</template>
