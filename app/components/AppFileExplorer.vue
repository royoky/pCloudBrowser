<script setup lang="ts">
import type { ContextMenuAction } from '~~/app/models/context-menu'
import { FILE_MENU_ITEMS, FOLDER_MENU_ITEMS } from '~~/app/models/context-menu'

const { createFolder } = useFolderOperations()
const { handleOperation } = useContextMenuOperations()
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
  }
  else {
    console.error(result.message || 'Failed to create folder')
  }
}

// Context menu
const contextMenu = useTemplateRef('contextMenu')
const isContextMenuOpen = ref<boolean>(false)
const selectedId = ref<string>()
const menuItems = ref<{ text: string, value: ContextMenuAction, disabled?: boolean }[]>([])

function onContextMenu(e: MouseEvent, id: string, isFolder: boolean) {
  selectedId.value = id
  menuItems.value = isFolder ? FOLDER_MENU_ITEMS : FILE_MENU_ITEMS
  contextMenu.value?.show(e.pageX, e.pageY)
}

async function onMenuClicked(action: ContextMenuAction) {
  if (!selectedId.value) {
    console.warn('No item selected for context menu operation')
    return
  }

  const result = await handleOperation(action, selectedId.value, {
    targetFolderId: folderId.value,
    allowOverwrite: false,
  })

  if (result.success) {
    refresh()
  }
  else {
    console.error(result.message || 'Operation failed')
  }
}
</script>

<template>
  <div class="d-flex flex-column w-100 ga-4" style="max-width: 1080px;">
    <div class="d-flex justify-end">
      <VBtn
        color="primary"
        prepend-icon="mdi-folder-plus"
        @click="isNewFolderDialogOpen = true"
      >
        New Folder
      </VBtn>
    </div>

    <AppBreadcrumbs :items="breadcrumbsItems" />
    <AppContextMenu
      ref="contextMenu"
      v-model="isContextMenuOpen"
      :menu-items="menuItems"
      @on-menu-clicked="onMenuClicked"
    >
      <AppItemList
        :folders="folders"
        :files="files"
        :is-top-level="isTopLevel"
        @on-folder-click="navigateTo"
        @on-file-click="navigateToFile"
        @on-parent-folder-click="navigateUp"
        @on-file-context-menu="onContextMenu"
        @on-context-menu="(e, id, isFolder) => onContextMenu(e, id, isFolder)"
      />
    </AppContextMenu>
    <AppFileUpload :folder-id="folderId" @files-uploaded="refresh" />

    <AppNewFolderDialog
      v-model="isNewFolderDialogOpen"
      @create="onCreateFolder"
    />
  </div>
</template>
