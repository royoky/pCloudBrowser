<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuth } from '~/store/auth'

const { logout, login } = useAuth()
const { authenticated } = storeToRefs(useAuth())
const router = useRouter()

async function logUserOut() {
  logout()
  router.push('/')
}
</script>

<template>
  <div
    class="d-flex justify-center pa-6 h-100"
    :class="[authenticated ? 'align-top' : 'align-center']"
  >
    <VBtn v-if="!authenticated" @click="login">
      Login to pCloud
    </VBtn>

    <div v-if="authenticated" class="d-flex flex-column align-center">
      <VBtn class="align-self-end my-6" @click="logUserOut">
        Logout
      </VBtn>
      <AppFileExplorer />
    </div>
  </div>
</template>
