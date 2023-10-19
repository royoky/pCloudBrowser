import { storeToRefs } from "pinia";
import { useAuth } from "~/store/auth";

export default defineNuxtRouteMiddleware((to) => {
  const { authenticated } = storeToRefs(useAuth());
  const token = useCookie("token");

  if (!token.value && to?.name === "oauth") {
    return;
  }

  if (token.value) {
    authenticated.value = true; // update the state to authenticated
  }

  if (!token.value && to.path !== "/") {
    abortNavigation();
    return navigateTo("/");
  }
});
