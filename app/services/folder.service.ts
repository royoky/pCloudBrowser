import type {
  ListFolderData,
  PCloudCreateFolderMetadata,
} from '~/models/api-return-types'

export default class FolderService {
  // GET
  public static async listFolder(
    folderId: number,
    params?: {
      recursive?: boolean
      showDeleted?: boolean
      nofiles?: boolean
      noShares?: boolean
    },
  ) {
    return useFetch<ListFolderData>(`/api/pcloud/folders/${folderId}`, {
      params,
    })
  }

  public static async create({
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
}
