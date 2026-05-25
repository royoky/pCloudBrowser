<script setup lang="ts">
import type { ContextMenuAction } from '~~/app/models/context-menu'
import type { MiniCloudFolder } from '~~/shared/models/cloud-item'

interface Props {
  folders: MiniCloudFolder[]
  action: ContextMenuAction
  parentId: string | null
  sourceFolderId?: string | null
}

const { folders, parentId, sourceFolderId } = defineProps<Props>()

const emit = defineEmits<{
  onFolderSelected: [folder: MiniCloudFolder]
}>()

// Check if folder should be excluded from the tree
function shouldExcludeFolder(folderId: string): boolean {
  if (!sourceFolderId)
    return false
  return folderId === sourceFolderId
}

// Check if folder should be disabled (parent of excluded folder)
function shouldDisableFolder(folderId: string): boolean {
  if (!sourceFolderId)
    return false
  const sourceFolder = folders.find(f => f.id === sourceFolderId)
  if (sourceFolder?.parentId === folderId)
    return true
  return false
}

// Normalize parentId for comparison - handle both '0' string and null
function normalizeParentId(parentId: string | null | undefined): string {
  if (!parentId || parentId === '0' || parentId === null) {
    return '0' // Root identifier
  }
  return parentId
}

// Get child folders for a given parent ID, excluding source folder
const childFolders = computed(() => {
  const targetParentId = parentId || '0'
  const normalizedParentId = normalizeParentId(targetParentId)
  return folders.filter((f) => {
    const folderParentId = normalizeParentId(f.parentId)
    return folderParentId === normalizedParentId && !shouldExcludeFolder(f.id)
  })
})

// Check if a folder has subfolders
function hasSubfolders(folderId: string): boolean {
  return folders.some((f) => {
    const folderParentId = normalizeParentId(f.parentId)
    return folderParentId === folderId
  })
}

function handleFolderClick(folder: MiniCloudFolder) {
  emit('onFolderSelected', folder)
}
</script>

<template>
  <VListItem v-if="!childFolders.length" link disabled>
    <template #prepend>
      <VIcon icon="mdi-information-outline" />
    </template>
    <VListItemTitle>No folders available</VListItemTitle>
  </VListItem>

  <template v-for="folder in childFolders" :key="`folder-${folder.id}`">
    <VListItem link @click="!shouldDisableFolder(folder.id) && handleFolderClick(folder)">
      <template #prepend>
        <VIcon icon="mdi-folder" />
      </template>
      <VListItemTitle>{{ folder.name }}</VListItemTitle>

      <!-- Nested sub-menu for folders with children -->
      <VMenu
        v-if="hasSubfolders(folder.id)"
        activator="parent"
        :open-on-focus="false"
        open-on-hover
        submenu
      >
        <VList density="compact">
          <AppFolderPickerMenu
            :folders="folders"
            :action="action"
            :source-folder-id="sourceFolderId"
            :parent-id="folder.id"
            @on-folder-selected="(selectedFolder) => $emit('onFolderSelected', selectedFolder)"
          />
        </VList>
      </VMenu>

      <template v-if="hasSubfolders(folder.id)" #append>
        <VIcon icon="mdi-menu-right" size="x-small" />
      </template>
    </VListItem>
  </template>
</template>
