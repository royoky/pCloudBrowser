/**
 * VueFinder Driver (client UI adapter).
 *
 * Implements VueFinder's `Driver` interface by calling the neutral
 * `/api/{provider}/*` API and mapping its DTOs to VueFinder's shapes.
 * This is the ONLY VueFinder-aware code; swapping the file-manager library
 * means replacing this adapter, with no change to the server.
 *
 * Errors are intentionally NOT swallowed — they propagate to VueFinder's
 * `@error` handler so failures are visible instead of showing an empty view.
 */

import type {
  BatchResultDto,
  ContentDto,
  FolderDto,
  SearchResultDto,
} from '~~/shared/contracts/file-system.dto'

import type {
  VueFinderDeleteParams,
  VueFinderDeleteResult,
  VueFinderDirEntry,
  VueFinderDriver,
  VueFinderFileContentResult,
  VueFinderFileOperationResult,
  VueFinderFsData,
  VueFinderListParams,
  VueFinderRenameParams,
  VueFinderSearchParams,
  VueFinderTransferParams,
} from '~~/shared/types/vuefinder'

import { toDirEntry, toFsData } from './mapper'
import { toNeutralPath } from './path'

/**
 * Creates a VueFinder driver bound to a single storage/provider
 * (e.g. 'pcloud' -> /api/pcloud/*).
 */
export function createVueFinderDriver(storage: string): VueFinderDriver {
  const base = `/api/${storage}`

  /** Lists a neutral path and maps it to VueFinder FsData. */
  const list = (neutralPath: string): Promise<VueFinderFsData> =>
    $fetch<FolderDto>(`${base}/list`, { params: { path: neutralPath } })
      .then(folder => toFsData(storage, folder))

  const toNeutral = (vueFinderPath: string | undefined): string =>
    toNeutralPath(storage, vueFinderPath)

  return {
    list(params?: VueFinderListParams): Promise<VueFinderFsData> {
      return list(toNeutral(params?.path))
    },

    async copy(params: VueFinderTransferParams): Promise<VueFinderFileOperationResult> {
      await $fetch<BatchResultDto>(`${base}/copy`, {
        method: 'POST',
        body: {
          sources: params.sources.map(toNeutral),
          destinationPath: toNeutral(params.destination),
        },
      })
      // Copy leaves the source dir unchanged; refresh the dir being viewed.
      return list(toNeutral(params.path ?? params.destination))
    },

    async move(params: VueFinderTransferParams): Promise<VueFinderFileOperationResult> {
      await $fetch<BatchResultDto>(`${base}/move`, {
        method: 'POST',
        body: {
          sources: params.sources.map(toNeutral),
          destinationPath: toNeutral(params.destination),
        },
      })
      return list(toNeutral(params.path ?? params.destination))
    },

    async rename(params: VueFinderRenameParams): Promise<VueFinderFileOperationResult> {
      await $fetch(`${base}/items`, {
        method: 'PATCH',
        body: { path: toNeutral(params.item), newName: params.name },
      })
      return list(toNeutral(params.path))
    },

    async delete(params: VueFinderDeleteParams): Promise<VueFinderDeleteResult> {
      await $fetch<BatchResultDto>(`${base}/delete`, {
        method: 'POST',
        body: { paths: params.items.map(item => toNeutral(item.path)) },
      })
      return list(toNeutral(params.path))
    },

    async createFolder(
      params: { path: string, name: string },
    ): Promise<VueFinderFileOperationResult> {
      await $fetch(`${base}/create-folder`, {
        method: 'POST',
        body: { parentPath: toNeutral(params.path), name: params.name },
      })
      return list(toNeutral(params.path))
    },

    async search(params: VueFinderSearchParams): Promise<VueFinderDirEntry[]> {
      const result = await $fetch<SearchResultDto>(`${base}/search`, {
        params: {
          query: params.filter,
          path: toNeutral(params.path),
          recursive: params.deep,
          type: 'both',
        },
      })
      return result.items.map(item => toDirEntry(storage, item))
    },

    async getContent(params: { path: string }): Promise<VueFinderFileContentResult> {
      return $fetch<ContentDto>(`${base}/content`, {
        params: { path: toNeutral(params.path) },
      })
    },

    getDownloadUrl(params: { path: string }): string {
      return `${base}/download?path=${encodeURIComponent(toNeutral(params.path))}`
    },

    getPreviewUrl(params: { path: string }): string {
      return `${base}/preview?path=${encodeURIComponent(toNeutral(params.path))}`
    },

    // Disabled in the UI (features.archive / edit = false). Reject loudly
    // rather than pretend success, so a misconfig surfaces immediately.
    async archive(): Promise<VueFinderFileOperationResult> {
      throw new Error('Archive is not supported')
    },
    async unarchive(): Promise<VueFinderFileOperationResult> {
      throw new Error('Unarchive is not supported')
    },
    async createFile(): Promise<VueFinderFileOperationResult> {
      throw new Error('Create file is not supported')
    },
    async save(): Promise<string> {
      throw new Error('Save is not supported')
    },
  }
}
