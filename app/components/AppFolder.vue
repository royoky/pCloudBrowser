<script setup lang="ts">
import type { MiniCloudFolder } from '~~/shared/models/cloud-item'

defineProps<{
  folder: MiniCloudFolder
}>()

defineEmits<{
  onFolderClick: [id: string]
}>()
</script>

<template>
  <VListItem
    :title="folder.name"
    :subtitle="folder.modifiedAt"
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
