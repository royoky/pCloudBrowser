<script setup lang="ts">
import type { PCloudFile, PCloudFolder } from '~/models/api-return-types'

defineProps<{
  folders: PCloudFolder[] | null
  files: PCloudFile[] | null
  isTopLevel: boolean
}>()

defineEmits<{
  (e: 'onFolderClick', id: number): void
  (e: 'onFileClick', id: number): void
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
    <VListItem
      v-if="!isTopLevel"
      title=".."
      @click="$emit('onParentFolderClick')"
    >
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
      @on-folder-click="$emit('onFolderClick', folder.folderid)"
    />

    <VDivider inset />

    <VListSubheader v-if="files?.length" inset>
      Files
    </VListSubheader>
    <AppFile v-for="file in files" :key="file.id" :file="file" @click="$emit('onFileClick', file.id)" />
  </VList>
</template>
