<script setup lang="ts">
import type {
  PCloudFile,
  PCloudFolder,
} from '~/models/api-return-types'

const { useListFolder } = useFolder()

const folderId = ref<number>(0)

const breadcrumbsItems = ref<string[]>(['All Files'])

const params = { recursive: true }

const { data } = await useListFolder(folderId, params)

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
</script>

<template>
  <div class="app-file-explorer d-flex flex-column">
    <AppBreadcrumbs :items="breadcrumbsItems" />
    <AppItemList
      :folders="folders"
      :files="files"
      :is-top-level="isTopLEvel"
      @on-folder-click="onFolderClick"
      @on-parent-folder-click="onParentFolderClick"
    />
  </div>
</template>

<style lang="scss">
.app-file-explorer {
  width: 25rem;
}
</style>
