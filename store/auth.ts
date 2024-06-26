export const useAuth = defineStore('auth', () => {
  const authenticated = ref<boolean>(false)
  const loading = ref<boolean>(false)

  const { public: config } = useRuntimeConfig()

  function login() {
    const authUrl = config.pcloudAuthUrl
    const redirect_uri = config.redirectUri
    const client_id = config.appClientId
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
