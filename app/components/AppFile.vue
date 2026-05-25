<script setup lang="ts">
import type { CloudFile } from '~~/shared/models/cloud-item'

defineProps<{
  file: CloudFile
}>()
</script>

<template>
  <VListItem :title="file.name" :subtitle="file.modifiedAt">
    <template #prepend>
      <VAvatar color="blue">
        <VIcon>
          {{ file.category === 'archive' ? 'mdi-archive' : `mdi-file-${file.category}` }}
        </VIcon>
      </VAvatar>
    </template>

    <template #append>
      <VBtn
        color="grey-lighten-1"
        icon="mdi-information"
        variant="text"
        @click.stop="console.log(`info about file id ${file.id}`)"
      />
    </template>
  </VListItem>
</template>
