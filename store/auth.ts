export const useAuth = defineStore('auth', () => {
  const authenticated = ref<boolean>(false)
  const loading = ref<boolean>(false)

  function login() {
    const authUrl = 'https://my.pcloud.com/oauth2/authorize'
    const redirect_uri = import.meta.env.VITE_REDIRECT_URI
    const client_id = import.meta.env.VITE_CLIENT_ID
    const response_type = 'code'
    const oauthUrl = encodeURI(
      `${authUrl}?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}`,
    )
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
