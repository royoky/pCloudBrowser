<script setup lang="ts">
import type { OAuthToken } from '~/models/api-return-types'
import { storeToRefs } from 'pinia'
import { authService } from '~/services/auth.service'
import { useAuth } from '~/store/auth'

const route = useRoute()
const router = useRouter()
const { authenticated, loading } = storeToRefs(useAuth())
const { code, hostname }: Record<string, any> = route.query

const { getTokenFromCode } = authService()

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
    const oAuthData: OAuthToken = await getTokenFromCode(
      code,
      hostname,
    )
    if (oAuthData?.access_token) {
      const token = useCookie('token')
      const hostnameCookie = useCookie('hostname')
      token.value = oAuthData.access_token
      hostnameCookie.value = hostname
      authenticated.value = true
    }
    else {
      throw new Error(`cannot get token :: ${oAuthData.result}`)
    }
  }
  catch (err) {
    console.error(err)
    displayedText.value = 'Une erreur est survenue'
  }
})
</script>

<template>
  <div class="d-flex justify-center align-center w-100 h-100">
    {{ displayedText }}
  </div>
</template>
