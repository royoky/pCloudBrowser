<template>
  <div class="d-flex justify-center align-center pa-6 h-100">
    <v-btn v-if="!authenticated" @click="loginToPCloud">Login to pCloud</v-btn>

    <div v-if="authenticated" class="d-flex flex-column align-center">
      <v-btn class="align-self-end my-6" @click="logUserOut">Logout</v-btn>

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
import {
  ListFolderData,
  PCloudFile,
  PCloudFolder,
} from "~/models/api-return-types";
import { useAuth } from "~/store/auth";
import FolderService from "~/services/folder.service";
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

const refData = ref<ListFolderData | null>(null);
const folders = ref<PCloudFolder[]>([]);
const files = ref<PCloudFile[]>([]);

const params = {
  recursive: true,
};

async function fetchExample() {
  debugger;
  const { data } = await FolderService.listFolder(0, params);

  if (data.value) {
    folders.value = data.value.metadata?.contents?.filter(
      (elt: PCloudFile | PCloudFolder) => elt.isfolder
    );
    files.value = data.value.metadata?.contents?.filter(
      (elt: PCloudFile | PCloudFolder) => !elt.isfolder
    );
  }
}

async function logUserOut() {
  logout();
  router.push("/");
}
</script>
