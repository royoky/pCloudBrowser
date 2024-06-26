<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type { OAuthToken } from '~/models/api-return-types';
import AuthService from '~/services/auth.service';
import { useAuth } from '~/store/auth';

const route = useRoute()
const router = useRouter()
const { authenticated, loading } = storeToRefs(useAuth())
const { code, hostname }: Record<string, any> = route.query

const hostnameCookie = useCookie('hostname')
hostnameCookie.value = hostname

const displayedText = ref<string>('Logging to pCloud ...')

watchEffect(() => {
  if (authenticated.value) {
    displayedText.value = 'Successfully Logged in !'
    setTimeout(() => router.push('/'), 1000)
  }
})

onMounted(async () => {
  try {
    loading.value = true
    const oAuthData: OAuthToken = await AuthService.getTokenFromCode(code)
    if (oAuthData?.access_token) {
      const token = useCookie('token')
      token.value = oAuthData.access_token
      authenticated.value = true
    }
    else {
      throw new Error(`cannot get token :: ${oAuthData.result}`)
    }
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="d- justify-center align-center">
    {{ displayedText }}
  </div>
</template>
