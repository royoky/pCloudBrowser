<template>
  <div class="d-flex justify-center align-center pa-6 h-100">
    <v-btn v-if="!authStore.isAuthenticated" @click="loginToPCloud"
      >Login to pCloud</v-btn
    >

    <div
      v-if="authStore.isAuthenticated"
      class="d-flex flex-column align-center"
    >
      <v-btn class="align-self-end my-6" @click="logout">Logout</v-btn>

      <div class="d-flex">
        <v-btn @click="fetchExample">FETCH</v-btn>
        <AppItemList
          v-if="folders?.length || files?.length"
          :folders="folders"
          :files="files"
        ></AppItemList>
      </div>
      <pre><code>{{refData}}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import AuthService from "~/services/auth.service";
import {
  ApiResultCode,
  ListFolderData,
  PCloudFile,
  PCloudFolder,
} from "~/services/models/api-return-types";
import { useAuth } from "~/store/auth";
import FolderService from "~/services/folder.service";

const authStore = useAuth();

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

const refData = ref<ListFolderData | null>(null);
const folders = ref<PCloudFolder[]>([]);
const files = ref<PCloudFile[]>([]);

const params = {
  recursive: true,
};

async function fetchExample() {
  const data = await FolderService.listFolder(0, params);

  if (data) {
    folders.value = data.metadata?.contents?.filter(
      (elt: PCloudFile | PCloudFolder) => elt.isfolder
    );
    files.value = data.metadata?.contents?.filter(
      (elt: PCloudFile | PCloudFolder) => !elt.isfolder
    );
  }
}

async function logout() {
  const res = await $fetch<ApiResultCode>(
    `https://${authStore.baseUrl}/logout`,
    {
      params: { logout: true, access_token: authStore.token },
    }
  );

  if (res.result === 0) {
    authStore.$patch({
      baseUrl: "",
      token: "",
      userId: null,
    });
    localStorage.setItem("token", "");
    localStorage.setItem("baseUrl", "");
  }
}

onMounted(() => {
  AuthService.checkLocalStorage();
});
</script>
