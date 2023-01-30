<template>
  <div class="index">
    <div class="index__auth">
      <v-btn v-if="!authStore.isAuthenticated" @click="openLink"
        >Login to pCloud</v-btn
      >
      <v-btn v-else @click="logout">Logout</v-btn>
    </div>

    <div v-if="authStore.isAuthenticated">
      <v-btn @click="fetchExample">FETCH</v-btn>
      <AppItemList
        v-if="folders || files"
        :folders="folders"
        :files="files"
      ></AppItemList>
      <pre><code>{{refData}}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ListFolderData,
  PCloudFile,
  PCloudFolder,
} from "~~/services/models/api-return-types";
import { useAuth } from "~~/store/auth";

const authStore = useAuth();

function openLink() {
  const authUrl = "https://my.pcloud.com/oauth2/authorize";
  const redirect_uri = "http://127.0.0.1:3000/oauth";
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
  folderid: 0,
  recursive: true,
  access_token: authStore.token,
};

async function fetchExample() {
  const { data } = await useFetch<any, Error, string, any>(
    `https://${authStore.baseUrl}/listfolder`,
    {
      params,
    }
  );

  folders.value = data.value.metadata?.contents?.filter(
    (elt: PCloudFile | PCloudFolder) => elt.isfolder
  );
  files.value = data.value.metadata?.contents?.filter(
    (elt: PCloudFile | PCloudFolder) => !elt.isfolder
  );
}

async function logout() {
  const { data } = await useFetch("https://eapi.pcloud.com/logout", {
    params: { logout: true, access_token: authStore.token },
  });

  if ((data as any).result === 0) {
    authStore.$patch({
      baseUrl: "",
      token: "",
      userId: null,
    });
  }
}
</script>

<style lang="scss">
.index {
  display: flex;
  align-items: center;
  align-content: center;
  gap: 2 rem;
}
</style>
