<script setup lang="ts">
const { loggedIn, clear } = useUserSession()
</script>

<template>
  <div
    class="d-flex justify-center pa-6 h-100"
    :class="[loggedIn ? 'align-top' : 'align-center']"
  >
    <div v-if="loggedIn" class="d-flex flex-column align-center">
      <VBtn class="align-self-end my-6" @click="clear">
        Logout
      </VBtn>
      <AppFileExplorer />
    </div>

    <VBtn v-else>
      <a href="/auth/pcloud">Log In with pCloud</a>
    </VBtn>
  </div>
</template>
