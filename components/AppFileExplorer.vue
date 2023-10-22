<template>
  <div class="d-flex">
    <AppItemList
      v-if="folders?.length || files?.length"
      :folders="folders"
      :files="files"
      @on-folder-click="onFolderClick"
    ></AppItemList>
  </div>
</template>

<script setup lang="ts">
import {
  ListFolderData,
  PCloudFile,
  PCloudFolder,
} from "~/models/api-return-types";

const folderId = ref<number>(0);

const folders = computed(
  (): PCloudFolder[] =>
    data.value?.metadata?.contents?.filter(
      (elt: PCloudFile | PCloudFolder) => elt.isfolder
    ) ?? []
);
const files = computed(
  (): PCloudFile[] =>
    data.value?.metadata?.contents?.filter(
      (elt: PCloudFile | PCloudFolder) => !elt.isfolder
    ) ?? []
);

const parentFolderId = computed(
  (): number | null => data.value?.metadata.parentfolderid ?? null
);

const params = {
  recursive: true,
};

const url = computed((): string => `/api/pcloud/folders/${folderId.value}`);

const { data, pending, error, execute } = await useFetch<ListFolderData>(url, {
  params,
});

function onFolderClick(clickedId: number) {
  folderId.value = clickedId;
}
</script>

<style lang="scss" scoped></style>
