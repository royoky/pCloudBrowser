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
</script>

<template>
  <div class="app-file-explorer d-flex flex-column">
    <AppBreadcrumbs :items="breadcrumbsItems" />
    <AppItemList
      :folders="folders"
      :files="files"
      :is-top-level="isTopLEvel"
      @on-folder-click="onFolderClick"
      @on-file-click="onFileClick"
      @on-parent-folder-click="onParentFolderClick"
    />
  </div>
  <AppFileUpload @files-uploaded="refresh" />
</template>

<style>
.app-file-explorer {
  width: 25rem;
}
</style>
