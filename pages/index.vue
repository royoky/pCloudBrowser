<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuth } from '~/store/auth'

const { login } = useAuth()
const { authenticated } = storeToRefs(useAuth())
</script>

<template>
  <div
    class="d-flex justify-center pa-6 h-100"
    :class="[authenticated ? 'align-top' : 'align-center']"
  >
    <VBtn v-if="!authenticated" @click="login">
      Login to pCloud
    </VBtn>

    <AppFileExplorer v-if="authenticated" />
  </div>
</template>
