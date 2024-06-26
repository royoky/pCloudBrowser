import type {
  ListFolderData,
  PCloudCreateFolderMetadata,
} from '~/models/api-return-types'

export default function () {
  async function useListFolder(
    folderId: MaybeRefOrGetter<number>,
    params?: {
      recursive?: boolean
      showDeleted?: boolean
      nofiles?: boolean
      noShares?: boolean
    },
  ) {
    return useFetch<ListFolderData>(() => `/api/pcloud/folders/${toValue(folderId)}`, {
      params,
    })
  }

  async function useCreateFolder({
    parentFolderId,
    name,
  }: {
    parentFolderId: number
    name: string
  }) {
    return useFetch<{
      result: number
      metadata: PCloudCreateFolderMetadata
      error?: string
    }>(`$api/pcloud/folders`, {
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
