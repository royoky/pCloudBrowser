<script setup lang="ts">
import type { CloudFile, MiniCloudFolder } from '~~/shared/models/cloud-item'

defineProps<{
  folders: MiniCloudFolder[] | null
  files: CloudFile[] | null
  isTopLevel: boolean
}>()

defineEmits<{
  (e: 'onFolderClick', id: string): void
  (e: 'onFileClick', id: string): void
  (e: 'onParentFolderClick'): void
}>()

/* function transformDateFromRFC2822(pCloudDate: string): string | null {
  const date = DateTime.fromRFC2822(pCloudDate)
  return date?.toISODate() ?? null
} */
</script>

<template>
  <VList lines="two">
    <VListSubheader inset>
      Folders
    </VListSubheader>
    <VListItem v-if="!isTopLevel" title=".." @click="$emit('onParentFolderClick')">
      <template #prepend>
        <VAvatar color="grey-lighten-1">
          <VIcon color="white">
            mdi-folder
          </VIcon>
        </VAvatar>
      </template>
    </VListItem>

    <AppFolder
      v-for="folder in folders"
      :key="folder.id"
      :folder="folder"
      @on-folder-click="$emit('onFolderClick', folder.id)"
    />

    <VDivider inset />

    <VListSubheader v-if="files?.length" inset>
      Files
    </VListSubheader>
    <AppFile
      v-for="file in files"
      :key="file.id"
      :file="file"
      @click="$emit('onFileClick', file.id)"
    />
  </VList>
</template>
