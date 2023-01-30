<template>
  <div class="oauth">{{ displayedText }}</div>
</template>

<script setup lang="ts">
import AuthService from "~~/services/auth.service";
import { useAuth } from "~~/store/auth";
import { OAuthToken } from "../services/models/api-return-types";

const route = useRoute();
const router = useRouter();
const authStore = useAuth();
const { code, state, locationid, hostname }: Record<string, any> = route.query;

const displayedText = ref<string>("Logging to pCloud ...");

authStore.$subscribe((mutation, state) => {
  if (state.token) {
    displayedText.value = "Successfully Logged in !";
    localStorage.setItem("token", authStore.token);
    localStorage.setItem("baseUrl", authStore.baseUrl);
    router.push("/");
  }
});

onMounted(async () => {
  try {
    const oAuthData = await AuthService.getTokenFromCode(code, hostname);

    if (oAuthData?.access_token) {
      authStore.$patch({
        baseUrl: hostname,
        token: oAuthData.access_token,
        userId: oAuthData.userid,
        locationId: oAuthData.locationid,
      });
    } else {
      throw new Error("cannot get token :: " + oAuthData.result);
    }
  } catch (err) {
    console.error(err);
  }
});
</script>
<style lang="scss"></style>
