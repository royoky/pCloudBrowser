<template>
  <v-list lines="two">
    <v-list-subheader inset>Folders</v-list-subheader>

    <AppFolder
      v-for="folder in folders"
      :key="folder.id"
      :folder="folder"
      @on-folder-click="$emit('onFolderClick', folder.folderid)"
    >
    </AppFolder>

    <v-divider inset></v-divider>

    <v-list-subheader inset>Files</v-list-subheader>

    <AppFile v-for="file in files" :key="file.id" :file="file"> </AppFile>
  </v-list>
</template>

<script setup lang="ts">
import type { PCloudFile, PCloudFolder } from "~/models/api-return-types";
import { DateTime } from "luxon";
import AppFolder from "./AppFolder.vue";
import AppFile from "./AppFile.vue";

defineProps<{
  folders: PCloudFolder[] | null;
  files: PCloudFile[] | null;
}>();

defineEmits<{
  onFolderClick: [id: number];
}>();

function transformDateFromRFC2822(pCloudDate: string): string | null {
  const date = DateTime.fromRFC2822(pCloudDate);
  return date?.toISODate() ?? null;
}
</script>
