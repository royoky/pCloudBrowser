<template>
  <div class="oauth">{{ displayedText }}</div>
</template>

<script setup lang="ts">
import { OAuthToken } from "~/services/models/api-return-types";
import AuthService from "~~/services/auth.service";
import { useAuth } from "~~/store/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuth();
const { code, state, locationid, hostname }: Record<string, any> = route.query;
const oneYear = 1000 * 3600 * 24 * 30.5 * 12;

const displayedText = ref<string>("Logging to pCloud ...");

authStore.$subscribe((mutation, state) => {
  if (state.token) {
    displayedText.value = "Successfully Logged in !";
    useCookie("token", {
      expires: new Date(Date.now() + 1000 * 3600 * 24 * 30.5 * 12),
    });
    router.push("/");
  }
});

onMounted(async () => {
  try {
    const oAuthData: OAuthToken = await AuthService.getTokenFromCode(
      code,
      hostname
    );
    if (oAuthData?.access_token) {
      authStore.$patch({
        baseUrl: hostname,
        token: oAuthData.access_token,
        userId: oAuthData.userid,
        locationId: oAuthData.locationid,
      });
      useCookie("token", {
        expires: new Date(Date.now() + oneYear),
      }).value = oAuthData.access_token;
      useCookie("hostname", {
        expires: new Date(Date.now() + oneYear),
      }).value = hostname;
    } else {
      throw new Error("cannot get token :: " + oAuthData.result);
    }
  } catch (err) {
    console.error(err);
  }
});
</script>
<style lang="scss"></style>
