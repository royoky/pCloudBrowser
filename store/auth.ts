export const useAuth = defineStore("auth", () => {
  const authenticated = ref<boolean>(false);
  const loading = ref<boolean>(false);

  function logout() {
    const token = useCookie("token");
    const hostname = useCookie("hostname");
    authenticated.value = false;
    token.value = null;
    hostname.value = null;
  }

  return {
    loading,
    authenticated,
    logout,
  };
});
