<template>
  <div class="index">
    <div class="index__auth">
      <v-btn v-if="!token" @click="loginToPCloud">Login to pCloud</v-btn>
      <v-btn v-else @click="logout">Logout</v-btn>
    </div>

    <div v-if="token">
      <v-btn @click="fetchRootFolder">FETCH</v-btn>
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
import AuthService from "~~/services/auth.service";
import {
  ApiResultCode,
  ListFolderData,
  PCloudFile,
  PCloudFolder,
} from "~~/services/models/api-return-types";
import { useAuth } from "~~/store/auth";
import FolderService from "~/services/folder.service";

const authStore = useAuth();

const token = useCookie("token");
const hostname = useCookie("hostname");

function loginToPCloud() {
  const oAuthUrl = AuthService.getPCloudAuthUrl();
  window.location.href = oAuthUrl;
}

const refData = ref<ListFolderData | null>(null);
const folders = ref<PCloudFolder[]>([]);
const files = ref<PCloudFile[]>([]);

const params = {
  recursive: true,
};

async function fetchRootFolder() {
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
  authStore.$patch({
    baseUrl: "",
    token: "",
    userId: null,
  });

  token.value = "";
  hostname.value = "";
}

onMounted(() => {
  AuthService.checkLocalStorage();
});
</script>

<style lang="scss">
.index {
  display: flex;
  align-items: center;
  align-content: center;
  gap: 2 rem;
}
</style>
