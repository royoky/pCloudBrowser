<template>
  <div class="oauth">{{ displayedText }}</div>
</template>

<script setup lang="ts">
import AuthService from "~~/services/auth.service";
import { useAuth } from "~~/store/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuth();
const { code, state, locationid, hostname } = route.query as any;

const displayedText = ref<string>("Logging to pCloud ...");

authStore.$subscribe((mutation, state) => {
  console.log("sub sub");
  if (state.token) {
    console.log("got Token", authStore.token);
    displayedText.value = "Successfully Logged in !";
    setTimeout(() => {
      router.push("/");
    }, 1000);
  }
});

authStore.baseUrl = hostname;

onMounted(async () => {
  try {
    const oAuthData = await AuthService.getTokenFromCode(code, hostname);
    authStore.token = oAuthData.access_token;
    authStore.userId = oAuthData.userid;
  } catch (err) {
    console.error(err);
  }
});

onBeforeUnmount(() => {
  if (authStore.token) {
    useLocalStorage("token", authStore.token);
  }
});
</script>
<style lang="scss"></style>
