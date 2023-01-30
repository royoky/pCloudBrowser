import AuthService from "~~/services/auth.service";
import { UserInfo } from "../services/models/api-return-types";

export const useAuth = defineStore("auth", () => {
  const token = ref<string>("");
  const user = ref<string>("");
  const userId = ref<number | null>(null);
  const locationId = ref<number | null>(null);
  const baseUrl = ref<string>("");

  async function getUserInfo(): Promise<UserInfo> {
    return AuthService.getMe();
  }

  async function logout() {
    if (user) {
      await AuthService.logout();
    }
  }

  const isAuthenticated = computed((): boolean => !!token.value);

  return {
    token,
    user,
    userId,
    locationId,
    baseUrl,
    getUserInfo,
    isAuthenticated,
  };
});
