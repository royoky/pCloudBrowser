import type { MiniCloudFolder } from '~~/shared/models/cloud-item'

/**
 * Fetches the complete folder tree from root with recursive=true.
 * Used for context menu to always show full folder hierarchy from root.
 */
export function useFolderTree() {
  const { useListFolder } = useFolder()

  // Fetch full tree from root once (cached by Nuxt)
  const { data, refresh } = useListFolder(ref('0'), { recursive: true })

  // Recursively extract all folders from the tree
  function extractAllFolders(entry: any): MiniCloudFolder[] {
    const result: MiniCloudFolder[] = []

    const entries = entry.entries || []

    for (const item of entries) {
      if (item?.type === 'folder') {
        const folder: MiniCloudFolder = {
          id: item.id,
          name: item.name,
          type: item.type,
          path: item.path,
          parentId: item.parentId,
          createdAt: item.createdAt,
          modifiedAt: item.modifiedAt,
          itemCount: item.itemCount,
          capabilities: item.capabilities,
        }
        result.push(folder, ...extractAllFolders(item))
      }
    }
    return result
  }

  // Extract all folders from the full tree
  const allFolders = computed<MiniCloudFolder[]>(() => {
    if (!data.value)
      return []
    const result = extractAllFolders(data.value)

    // Include root folder itself
    result.unshift({
      id: data.value.id,
      name: 'Root',
      type: data.value.type,
      path: data.value.path,
      parentId: data.value.parentId,
      createdAt: data.value.createdAt,
      modifiedAt: data.value.modifiedAt,
      itemCount: data.value.itemCount,
      capabilities: data.value.capabilities,
    })

    return result
  })

  // Root folder ID (needed to identify root-level folders)
  const rootFolderId = computed(() => data.value?.id)

  return { allFolders, rootFolderId, refresh }
}
