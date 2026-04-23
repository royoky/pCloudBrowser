<script setup lang="ts">
import type { CloudFile, MiniCloudFolder } from '~~/shared/models/cloud-item'

defineProps<{
  folders: MiniCloudFolder[] | null
  files: CloudFile[] | null
  isTopLevel: boolean
}>()

const emit = defineEmits<{
  (e: 'onFolderClick', id: string): void
  (e: 'onFileClick', id: string): void
  (e: 'onContextMenu', event: MouseEvent, id: string, isFolder: boolean): void
  (e: 'onParentFolderClick'): void
}>()

function onContextMenu(e: MouseEvent, id: string, isFolder: boolean) {
  emit('onContextMenu', e, id, isFolder)
}
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
      @contextmenu.prevent="onContextMenu($event, folder.id, true)"
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
      @contextmenu.prevent="onContextMenu($event, file.id, false)"
    />
  </VList>
</template>
