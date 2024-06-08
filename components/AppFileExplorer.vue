<script setup lang="ts">
import AppContextMenu from './AppContextMenu.vue'
import type {
  ApiResultCode,
  ListFolderData,
  PCloudFile,
  PCloudFolder,
} from '~/models/api-return-types'

const folderId = ref<number>(0)

const breadcrumbsItems = ref<string[]>(['All Files'])

const url = computed((): string => `/api/pcloud/folders/${folderId.value}`)
const params = { recursive: true }

const { data, refresh } = await useFetch<ListFolderData>(url, { params })

const folders = computed(
  (): PCloudFolder[] =>
    data.value?.metadata?.contents?.filter(
      (elt: PCloudFile | PCloudFolder) => elt.isfolder,
    ) ?? [],
)
const files = computed(
  (): PCloudFile[] =>
    data.value?.metadata?.contents?.filter(
      (elt: PCloudFile | PCloudFolder) => !elt.isfolder,
    ) ?? [],
)

const parentFolderId = computed(
  (): number | null => data.value?.metadata.parentfolderid ?? null,
)

const isTopLEvel = computed((): boolean => parentFolderId.value === null)

function onFolderClick(clickedId: number | null) {
  if (clickedId) {
    folderId.value = clickedId
    const folderName = folders.value.find(
      folder => folder.folderid === folderId.value,
    )?.name
    breadcrumbsItems.value.push(folderName ?? folderId.value.toString())
  }
}

function onParentFolderClick() {
  if (parentFolderId.value != null) {
    folderId.value = parentFolderId.value
    breadcrumbsItems.value.pop()
  }
}

const contextMenu = ref<InstanceType<typeof AppContextMenu>>()
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

const selectedId = ref<number>()

function onContextMenu(id: number, isFolder: boolean) {
  isContextMenuOpen.value = false
  selectedId.value = id
  nextTick(() => {
    menuItems.value = isFolder ? folderMenuItems : fileMenuItems
    contextMenu.value?.show()
  })
}

async function onMenuClicked(value: number | string) {
  switch (value) {
    case 1:
      try {
        const res = await $fetch<ApiResultCode>(`/api/pcloud/folders/${selectedId.value}`, { method: 'delete' })
        if (res.result === 0)
          refresh()
      }
      catch (error) {
        console.error(error)
      }
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
        @on-parent-folder-click="onParentFolderClick"
        @on-file-context-menu="onContextMenu"
        @on-context-menu="(folderId, isFolder) => onContextMenu(folderId, isFolder)"
      />
    </AppContextMenu>
  </div>
</template>

<style lang="scss">
.app-file-explorer {
  width: 25rem;
}
</style>
