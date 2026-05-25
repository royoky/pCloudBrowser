import type { CloudItem } from '~~/shared/models/cloud-item'

/**
 * Fetches the names of all items (files and folders) in a specific folder.
 * Used to check for name conflicts before copy/move operations.
 */
export async function getFolderContents(folderId: string): Promise<Set<string>> {
  const { entries } = await $fetch<{ entries: CloudItem[] }>(`/api/pcloud/folders/${folderId}`)
  const names = new Set<string>()
  for (const item of entries || []) {
    names.add(item.name)
  }
  return names
}
