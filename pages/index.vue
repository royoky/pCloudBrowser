<template>
  <div class="d-flex justify-center align-center pa-6 h-100">
    <v-btn v-if="!authenticated" @click="loginToPCloud">Login to pCloud</v-btn>

    <div v-if="authenticated" class="d-flex flex-column align-center">
      <v-btn class="align-self-end my-6" @click="logUserOut">Logout</v-btn>
      <AppFileExplorer />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/store/auth";
import { storeToRefs } from "pinia";

const { logout } = useAuth();
const { authenticated } = storeToRefs(useAuth());
const router = useRouter();

function loginToPCloud() {
  const authUrl = "https://my.pcloud.com/oauth2/authorize";
  const redirect_uri = "http://localhost:3000/oauth";
  const client_id = import.meta.env.VITE_CLIENT_ID;
  const response_type = "code";
  const oauthUrl = encodeURI(
    `${authUrl}?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}`
  );
  window.location.href = oauthUrl;
}

async function logUserOut() {
  logout();
  router.push("/");
}
</script>
