import type { CloudFile, MiniCloudFolder } from '~~/shared/models/cloud-item'

export function useFolderBrowser(initialFolderId: string = '0') {
  const { useListFolder } = useFolder()
  const folderId = ref<string>(initialFolderId)
  const breadcrumbsItems = ref<string[]>(['All Files'])

  const params = { recursive: true }
  const { data, refresh } = useListFolder(folderId, params)

  const parentFolderId = computed<string | null>(() => {
    if (folderId.value === '0')
      return null
    return data.value?.parentId ?? null
  })

  const folders = computed<MiniCloudFolder[]>(() =>
    data.value?.entries.filter((item): item is MiniCloudFolder => item.type === 'folder') ?? [],
  )

  const files = computed<CloudFile[]>(() =>
    data.value?.entries.filter((item): item is CloudFile => item.type === 'file') ?? [],
  )

  const isTopLevel = computed<boolean>(() => parentFolderId.value === null)

  function navigateTo(clickedId: string | null) {
    if (clickedId) {
      folderId.value = clickedId
      const folderName = folders.value.find(folder => folder.id === clickedId)?.name
      breadcrumbsItems.value.push(folderName ?? clickedId)
    }
  }

  function navigateUp() {
    if (parentFolderId.value) {
      folderId.value = parentFolderId.value
      breadcrumbsItems.value.pop()
    }
  }

  function navigateToFile(fileId: string) {
    try {
      const url = `/api/pcloud/files/${fileId}?proxy=true`
      globalThis.location.href = url
    }
    catch (error) {
      console.error('File download failed:', error)
    }
  }

  return {
    folderId,
    breadcrumbsItems,
    parentFolderId,
    folders,
    files,
    isTopLevel,
    navigateTo,
    navigateUp,
    navigateToFile,
    refresh,
  }
}
