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
   * @param parentFolderId - Parent folder ID
   * @param name - New folder name
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
