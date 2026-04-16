<script setup lang="ts">
import type { ContextMenuAction } from '~~/app/models/context-menu'
import type { CloudFile, MiniCloudFolder } from '~~/shared/models/cloud-item'
import { FILE_MENU_ITEMS, FOLDER_MENU_ITEMS } from '~~/app/models/context-menu'

const { useListFolder } = useFolder()
const { handleOperation } = useContextMenuOperations()
const { createFolder } = useFolderOperations()

const folderId = ref<string>('0')

// New folder dialog
const isNewFolderDialogOpen = ref<boolean>(false)
const newFolderName = ref<string>('')

const breadcrumbsItems = ref<string[]>(['All Files'])

const params = { recursive: true }

const { data, refresh } = await useListFolder(folderId, params)

const folders = computed<MiniCloudFolder[]>(
  () => data.value?.entries.filter((item): item is MiniCloudFolder => item.type === 'folder') ?? [],
)
const files = computed<CloudFile[]>(
  () => data.value?.entries?.filter((item): item is CloudFile => item.type === 'file') ?? [],
)

const parentFolderId = computed<string | null>(() => {
  if (folderId.value === '0')
    return null
  const parent = data.value?.parentId
  return parent ?? null
})

const isTopLEvel = computed((): boolean => parentFolderId.value === null)

function onFolderClick(clickedId: string | null) {
  if (clickedId) {
    folderId.value = clickedId
    const folderName = folders.value.find(folder => folder.id === clickedId)?.name
    breadcrumbsItems.value.push(folderName ?? clickedId)
  }
}

async function onFileClick(fileId: string) {
  try {
    const url = `/api/pcloud/files/${fileId}?proxy=true`

    globalThis.location.href = url
  }
  catch (error) {
    console.error('File download failed:', error)
    // Show error to user
  }
}

function onParentFolderClick() {
  if (parentFolderId.value) {
    folderId.value = parentFolderId.value
    breadcrumbsItems.value.pop()
  }
}

async function onCreateFolder() {
  if (!newFolderName.value) {
    console.warn('Folder name is required')
    return
  }

  const result = await createFolder(folderId.value, newFolderName.value)

  if (result.success) {
    newFolderName.value = ''
    isNewFolderDialogOpen.value = false
    refresh()
  }
  else {
    console.error(result.message || 'Failed to create folder')
  }
}

const contextMenu = useTemplateRef('contextMenu')
const isContextMenuOpen = ref<boolean>(false)

const menuItems = ref<{ text: string, value: ContextMenuAction, disabled?: boolean }[]>([])

const selectedId = ref<string>()

function onContextMenu(id: string, isFolder: boolean) {
  isContextMenuOpen.value = false
  selectedId.value = id
  nextTick(() => {
    menuItems.value = isFolder ? FOLDER_MENU_ITEMS : FILE_MENU_ITEMS
    contextMenu.value?.show()
  })
}

async function onMenuClicked(action: ContextMenuAction) {
  if (!selectedId.value) {
    console.warn('No item selected for context menu operation')
    return
  }

  // Use current folder as destination for copy/move operations
  const options = {
    targetFolderId: folderId.value,
    allowOverwrite: false, // Prevent overwriting by default
  }

  const result = await handleOperation(action, selectedId.value, options)

  if (result.success) {
    refresh()
    // TODO: Show success notification to user
  }
  else {
    // TODO: Show error notification to user
    console.error(result.message || 'Operation failed')
  }
}
</script>

<template>
  <div class="d-flex flex-column w-100">
    <div class="d-flex justify-end mb-4">
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
      :menu-items
      @on-menu-clicked="onMenuClicked"
    >
      <AppItemList
        :folders="folders"
        :files="files"
        :is-top-level="isTopLEvel"
        @on-folder-click="onFolderClick"
        @on-file-click="onFileClick"
        @on-parent-folder-click="onParentFolderClick"
        @on-file-context-menu="onContextMenu"
        @on-context-menu="(folderId, isFolder) => onContextMenu(folderId, isFolder)"
      />
    </AppContextMenu>
    <AppFileUpload @files-uploaded="refresh" />

    <VDialog v-model="isNewFolderDialogOpen" max-width="500px">
      <VCard>
        <VCardTitle>Create New Folder</VCardTitle>
        <VCardText>
          <VTextField
            v-model="newFolderName"
            label="Folder Name"
            autofocus
            @keyup.enter="onCreateFolder"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="isNewFolderDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="primary" @click="onCreateFolder">
            Create
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
