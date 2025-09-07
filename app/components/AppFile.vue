<script setup lang="ts">
import type { PCloudFile } from '~/models/api-return-types'

defineProps<{
  file: PCloudFile
}>()
</script>

<template>
  <VListItem
    :title="file.name"
    :subtitle="file.modified"
    @click="() => console.log('clicked')"
  >
    <template #prepend>
      <VAvatar color="yellow">
        <VIcon color="white">
          {{ `mdi-file-${file.icon}` }}
        </VIcon>
      </VAvatar>
    </template>

    <template #append>
      <VBtn
        color="grey-lighten-1"
        icon="mdi-information"
        variant="text"
      />
    </template>
  </VListItem>
</template>
