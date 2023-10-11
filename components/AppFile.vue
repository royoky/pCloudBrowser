<template>
  <v-list-item
    :title="file.name"
    :subtitle="file.modified"
    @click="() => console.log('clicked')"
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
</template>
<script setup lang="ts">
import { PCloudFile } from "~/models/api-return-types";

defineProps<{
  file: PCloudFile;
}>();
</script>
