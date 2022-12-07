import AuthService from "~~/services/auth.service";

export const useAuth = defineStore("auth", () => {
  const token = ref<string>("");
  const user = ref<string>("");
  const userId = ref<number | null>(null);
  const baseUrl = ref<string>("");

  async function login() {
    user.value = await AuthService.getMe();
  }

  async function logout() {
    if (user) {
      await AuthService.logout();
    }
  }

  const isAuthenticated = computed((): boolean => !!token.value);

  return { token, user, userId, baseUrl, login, isAuthenticated };
});
