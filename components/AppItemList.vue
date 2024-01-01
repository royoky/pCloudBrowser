<template>
  <v-list lines="two">
    <v-list-subheader inset>Folders</v-list-subheader>
    <v-list-item
      v-if="!isTopLevel"
      title=".."
      @click="$emit('onParentFolderClick')"
    >
      <template v-slot:prepend>
        <v-avatar color="grey-lighten-1">
          <v-icon color="white">mdi-folder</v-icon>
        </v-avatar>
      </template>
    </v-list-item>

    <AppFolder
      v-for="folder in folders"
      :key="folder.id"
      :folder="folder"
      @on-folder-click="$emit('onFolderClick', folder.folderid)"
    >
    </AppFolder>

    <v-divider inset></v-divider>

    <v-list-subheader v-if="files?.length" inset>Files</v-list-subheader>
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
  isTopLevel: boolean;
}>();

defineEmits<{
  (e: "onFolderClick", id: number): void;
  (e: "onParentFolderClick"): void;
}>();

function transformDateFromRFC2822(pCloudDate: string): string | null {
  const date = DateTime.fromRFC2822(pCloudDate);
  return date?.toISODate() ?? null;
}
</script>
