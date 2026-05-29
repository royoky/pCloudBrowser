import type { CloudFolder } from '~~/shared/models/cloud-item'

/**
 * Folder management composable
 * Provides functions for listing and managing folders in pCloud
 */
export function useFolder() {
  /**
   * List folder contents
   * @param folderId - The folder ID to list
   * @param params - Optional query parameters
   * @param params.recursive - Whether to list recursively
   * @param params.showDeleted - Whether to include deleted items
   * @param params.nofiles - Whether to exclude files
   * @param params.noShares - Whether to exclude shared items
   * @returns UseFetch result with data, status, error, and refresh
   */
  function useListFolder(
    folderId: MaybeRefOrGetter<string>,
    params?: {
      recursive?: boolean
      showDeleted?: boolean
      nofiles?: boolean
      noShares?: boolean
    },
  ) {
    return useFetch<CloudFolder>(() => `/api/pcloud/folders/${toValue(folderId)}`, {
      params,
    })
  }

  /**
   * Create a new folder
   * @param params - Object containing parentFolderId and name
   * @param params.parentFolderId - Parent folder ID
   * @param params.name - New folder name
   * @returns UseFetch result for the creation
   */
  function useCreateFolder({ parentFolderId, name }: { parentFolderId: number, name: string }) {
    return useFetch('/api/pcloud/folders', {
      params: {
        folderid: parentFolderId,
      },
      method: 'POST',
      body: {
        name,
      },
    })
  }

  return {
    useListFolder,
    useCreateFolder,
  }
}
