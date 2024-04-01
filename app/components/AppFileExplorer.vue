<script setup lang="ts">
import type { CloudFile, MiniCloudFolder } from '~~/shared/models/cloud-item'

const { useListFolder } = useFolder()

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

const folderMenuItems = [
  { value: 1, text: 'Delete folder' },
  { value: 2, text: 'Copy folder' },
  { value: 3, text: 'Move folder' },
]

const fileMenuItems = [
  { value: 4, text: 'Delete file' },
  { value: 5, text: 'Copy file' },
  { value: 6, text: 'Move file' },
]

const menuItems = ref<{ text: string | number, value: number | string }[]>([])

function onContextMenu(id: string, isFolder: boolean) {
  isContextMenuOpen.value = false
  menuItems.value = isFolder ? folderMenuItems : fileMenuItems
  contextMenu.value?.show()
}

function onMenuClicked(_value: number | string) {
  // TODO
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
