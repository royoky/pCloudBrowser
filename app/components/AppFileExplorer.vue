<script setup lang="ts">
import type { ContextMenuAction } from '~~/app/models/context-menu'
import type { MiniCloudFolder } from '~~/shared/models/cloud-item'
import { FILE_MENU_ITEMS, FOLDER_MENU_ITEMS } from '~~/app/models/context-menu'

const { createFolder } = useFolderOperations()
const { handleOperation } = useContextMenuOperations()
const { allFolders, refresh: refreshFolderTree } = useFolderTree()
const {
  folderId,
  breadcrumbsItems,
  folders,
  files,
  isTopLevel,
  navigateTo,
  navigateUp,
  navigateToFile,
  refresh,
} = useFolderBrowser()

// New folder dialog
const isNewFolderDialogOpen = ref<boolean>(false)

async function onCreateFolder(name: string) {
  const result = await createFolder(folderId.value, name)
  if (result.success) {
    isNewFolderDialogOpen.value = false
    refresh()
    await refreshFolderTree()
  }
  else {
    console.error(result.message || 'Failed to create folder')
  }
}

// Context menu
const contextMenu = useTemplateRef('contextMenu')
const isContextMenuOpen = ref<boolean>(false)
const selectedId = ref<string>()
const selectedIsFolderRef = ref<boolean>(false)
const menuItems = ref<{ text: string, value: ContextMenuAction, disabled?: boolean }[]>([])

// Store the source item ID for disabling in folder picker
const contextMenuSourceId = ref<string | null>(null)

function onContextMenu(e: MouseEvent, id: string, isFolder: boolean) {
  selectedId.value = id
  selectedIsFolderRef.value = isFolder
  menuItems.value = isFolder ? FOLDER_MENU_ITEMS : FILE_MENU_ITEMS

  // Store source ID for picker to disable invalid destinations
  contextMenuSourceId.value = id

  contextMenu.value?.show(e.pageX, e.pageY)
}

async function onMenuClicked(action: ContextMenuAction, targetFolder?: MiniCloudFolder) {
  if (!selectedId.value) {
    console.warn('No item selected for context menu operation')
    return
  }

  // Use provided targetFolder from folder picker, or default to current folder
  const destinationFolderId = targetFolder?.id || folderId.value

  // Check for name conflicts and auto-generate new name if needed
  const options: {
    targetFolderId: string
    newName?: string
    allowOverwrite: boolean
  } = {
    targetFolderId: destinationFolderId,
    allowOverwrite: false,
  }

  if (
    action === 'COPY_FILE'
    || action === 'COPY_FOLDER'
    || action === 'MOVE_FILE'
    || action === 'MOVE_FOLDER'
  ) {
    // TODO: Handle name conflicts with user dialog (Skip/Overwrite)
  }

  const result = await handleOperation(action, selectedId.value, options)

  if (result.success) {
    refresh()
    await refreshFolderTree()
  }
  else {
    console.error(result.message || 'Operation failed')
  }
}

function onFilesUploaded() {
  refresh()
  refreshFolderTree()
}
</script>

<template>
  <div class="d-flex flex-column w-100 ga-4" style="max-width: 1080px">
    <div class="d-flex justify-end">
      <VBtn color="primary" prepend-icon="mdi-folder-plus" @click="isNewFolderDialogOpen = true">
        New Folder
      </VBtn>
    </div>

    <AppBreadcrumbs :items="breadcrumbsItems" />
    <AppContextMenu
      ref="contextMenu"
      v-model="isContextMenuOpen"
      :menu-items="menuItems"
      :folders="allFolders"
      :source-folder-id="contextMenuSourceId"
      @on-menu-clicked="onMenuClicked"
    >
      <AppItemList
        :folders
        :files
        :is-top-level
        @on-folder-click="navigateTo"
        @on-file-click="navigateToFile"
        @on-parent-folder-click="navigateUp"
        @on-file-context-menu="onContextMenu"
        @on-context-menu="(e, id, isFolder) => onContextMenu(e, id, isFolder)"
      />
    </AppContextMenu>
    <AppFileUpload
      :folder-id="folderId"
      @files-uploaded="onFilesUploaded"
    />

    <AppNewFolderDialog v-model="isNewFolderDialogOpen" @create="onCreateFolder" />
  </div>
</template>
