import { storeToRefs } from "pinia";
import { useAuth } from "~/store/auth";

export default defineNuxtRouteMiddleware((to) => {
  const { authenticated } = storeToRefs(useAuth());
  const token = useCookie("token");

  if (!token.value && to?.name === "oauth") {
    return;
  }

  if (token.value && !authenticated.value) {
    authenticated.value = true;
  }

  if (!token.value && to.path !== "/") {
    abortNavigation();
    return navigateTo("/");
  }
});
