<script setup lang="ts">
const { loggedIn } = useUserSession()
</script>

<template>
  <div
    class="d-flex justify-center pa-6 ps-12 h-100"
    :class="[loggedIn ? 'align-top' : 'align-center']"
  >
    <AppFileExplorer v-if="loggedIn" />

    <VBtn v-else class="text-none" append-icon="mdi-login" href="/auth/pcloud">
      <span>Login</span>
    </VBtn>
  </div>
</template>
