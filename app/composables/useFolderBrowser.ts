import type { CloudFile, MiniCloudFolder } from '~~/shared/models/cloud-item'

export function useFolderBrowser(initialFolderId: string = '0') {
  const { useListFolder } = useFolder()
  const folderId = ref<string>(initialFolderId)
  const breadcrumbsItems = ref<string[]>(['All Files'])

  const params = { recursive: false }
  const { data, refresh } = useListFolder(folderId, params)

  // Get the actual folder ID - when we query '0', pCloud returns the real root folder ID
  const currentFolderActualId = computed<string>(() => {
    if (folderId.value === '0' && data.value?.id) {
      // Return the actual root folder ID from the response
      return data.value.id
    }
    return folderId.value
  })

  const parentFolderId = computed<string | null>(() => {
    // If we're at root (folderId is the actual root ID now, not '0'), parent is null
    return data.value?.parentId ?? null
  })

  const folders = computed<MiniCloudFolder[]>(
    () =>
      data.value?.entries.filter((item): item is MiniCloudFolder => item.type === 'folder') ?? [],
  )

  const files = computed<CloudFile[]>(
    () => data.value?.entries.filter((item): item is CloudFile => item.type === 'file') ?? [],
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
    currentFolderActualId,
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
