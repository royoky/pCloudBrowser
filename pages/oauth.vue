<template>
  <div class="oauth">{{ displayedText }}</div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import type { OAuthToken } from "~/models/api-return-types";
import AuthService from "~/services/auth.service";
import { useAuth } from "~/store/auth";

const route = useRoute();
const router = useRouter();
const { authenticated, loading } = storeToRefs(useAuth());
const { code, hostname }: Record<string, any> = route.query;

const displayedText = ref<string>("Logging to pCloud ...");

watchEffect(() => {
  if (authenticated.value) {
    displayedText.value = "Successfully Logged in !";
    setTimeout(() => router.push("/"), 1000);
  }
});

onMounted(async () => {
  try {
    loading.value = true;
    const oAuthData: OAuthToken = await AuthService.getTokenFromCode(
      code,
      hostname
    );
    if (oAuthData?.access_token) {
      const token = useCookie("token");
      const hostnameCookie = useCookie("hostname");
      token.value = oAuthData.access_token;
      hostnameCookie.value = hostname;
      authenticated.value = true;
    } else {
      throw new Error("cannot get token :: " + oAuthData.result);
    }
  } catch (err) {
    console.error(err);
  }
});
</script>
