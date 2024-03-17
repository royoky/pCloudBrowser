<script setup lang="ts">
import type { PCloudFolder } from '~/models/api-return-types'

defineProps<{
  folder: PCloudFolder
}>()

defineEmits<{
  onFolderClick: [id: number]
}>()
</script>

<template>
  <VListItem
    :title="folder.name"
    :subtitle="folder.modified"
    @click="$emit('onFolderClick', folder.id)"
  >
    <template #prepend>
      <VAvatar color="grey-lighten-1">
        <VIcon color="white">
          mdi-folder
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
