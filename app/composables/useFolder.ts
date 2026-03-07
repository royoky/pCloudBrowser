import type { CloudFolder } from '~~/shared/models/cloud-item'

export default function () {
  async function useListFolder(
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

  async function useCreateFolder({
    parentFolderId,
    name,
  }: {
    parentFolderId: number
    name: string
  }) {
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
