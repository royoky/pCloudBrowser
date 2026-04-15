<script setup lang="ts">
import type { ContextMenuAction } from '~~/app/models/context-menu'
import type { CloudFile, MiniCloudFolder } from '~~/shared/models/cloud-item'
import { FILE_MENU_ITEMS, FOLDER_MENU_ITEMS } from '~~/app/models/context-menu'

const { useListFolder } = useFolder()
const { handleOperation } = createContextMenuOperations()

const folderId = ref<string>('0')

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

  const result = await handleOperation(action, selectedId.value)

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
  <div class="app-file-explorer d-flex flex-column">
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
  </div>
  <AppFileUpload @files-uploaded="refresh" />
</template>
