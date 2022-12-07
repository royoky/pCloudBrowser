<template>
  <v-list lines="two">
    <v-list-subheader inset>Folders</v-list-subheader>

    <v-list-item
      v-for="folder in folders"
      :key="folder.id"
      :title="folder.name"
      :subtitle="folder.modified"
    >
      <template v-slot:prepend>
        <v-avatar color="grey-lighten-1">
          <v-icon color="white">mdi-folder</v-icon>
        </v-avatar>
      </template>

      <template v-slot:append>
        <v-btn
          color="grey-lighten-1"
          icon="mdi-information"
          variant="text"
        ></v-btn>
      </template>
    </v-list-item>

    <v-divider inset></v-divider>

    <v-list-subheader inset>Files</v-list-subheader>

    <v-list-item
      v-for="file in files"
      :key="file.id"
      :title="file.name"
      :subtitle="file.modified"
    >
      <template v-slot:prepend>
        <v-avatar color="yellow">
          <v-icon color="white">{{ `mdi-file-${file.icon}` }}</v-icon>
        </v-avatar>
      </template>

      <template v-slot:append>
        <v-btn
          color="grey-lighten-1"
          icon="mdi-information"
          variant="text"
        ></v-btn>
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { PCloudFile, PCloudFolder } from "~~/services/models/api-return-types";
import { DateTime } from "luxon";

defineProps<{
  folders: PCloudFolder[] | null;
  files: PCloudFile[] | null;
}>();

function transformDateFromRFC2822(pCloudDate: string): string {
  const date = DateTime.fromRFC2822(pCloudDate);
  if (date) return date.toISODate();
  return "";
}
</script>
