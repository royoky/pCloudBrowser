<template>
  <v-list-item
    :title="folder.name"
    :subtitle="folder.modified"
    @click="$emit('onFolderClick', folder.id)"
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
</template>
<script setup lang="ts">
import { PCloudFolder } from "~/models/api-return-types";

defineProps<{
  folder: PCloudFolder;
}>();

defineEmits<{
  onFolderClick: [id: number];
}>();
function onFolderClick() {}
</script>
