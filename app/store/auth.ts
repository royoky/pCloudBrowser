import { authService } from '~/services/auth.service'

export const useAuth = defineStore('auth', () => {
  const authenticated = ref<boolean>(false)
  const loading = ref<boolean>(false)

  function login() {
    const { getAuthOptions } = authService()
    const { authUrl, params } = getAuthOptions()
    const searchParams = new URLSearchParams(params)
    const oauthUrl = `${authUrl}?${searchParams.toString()}`
    window.location.href = oauthUrl
  }

  function logout() {
    const token = useCookie('token')
    const hostname = useCookie('hostname')
    authenticated.value = false
    token.value = null
    hostname.value = null
  }

  return {
    loading,
    authenticated,
    logout,
    login,
  }
})
