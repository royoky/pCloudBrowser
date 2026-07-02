/**
 * VueFinder Driver (client UI adapter).
 *
 * Implements VueFinder's `Driver` interface by calling the neutral
 * `/api/{provider}/*` API and mapping its DTOs to VueFinder's shapes.
 * This is the ONLY VueFinder-aware code; swapping the file-manager library
 * means replacing this adapter, with no change to the server.
 *
 * Errors from *operations* (rename/delete/copy/…) are intentionally NOT
 * swallowed — VueFinder's modals catch them and raise `@notify`/`@error`,
 * so they surface as toasts.
 *
 * Load/navigation errors are different: VueFinder fires `adapter.open()` as a
 * floating promise (VueFinderView.vue), so a failed listing never reaches
 * `@notify`, the loading spinner never clears, and the rejection is unhandled.
 * We therefore catch load failures in the public `list()` below: toast via the
 * injected `onLoadError`, then keep the user on their last good folder (or fall
 * back to the storage root on first load) so the UI stays usable.
 */

import type { Uppy } from '@uppy/core'

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

import { ChunkedUploader } from './chunked-uploader'
import { toDirEntry, toFsData } from './mapper'
import { toNeutralPath } from './path'

/** Options for wiring the driver to host-app concerns (e.g. notifications). */
export interface VueFinderDriverOptions {
  /**
   * Called when a folder *listing* fails. Lets the host surface a toast for
   * load/navigation errors that VueFinder itself swallows (see file header).
   */
  onLoadError?: (message: string) => void
}

/** Best-effort human-readable message from a `$fetch` error. */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error)
    return (error as { data?: { message?: string } }).data?.message ?? error.message
  return 'An unexpected error occurred'
}

/**
 * Creates a VueFinder driver bound to a single storage/provider
 * (e.g. 'pcloud' -> /api/pcloud/*).
 */
export function createVueFinderDriver(
  storage: string,
  options: VueFinderDriverOptions = {},
): VueFinderDriver {
  const base = `/api/${storage}`

  /** Lists a neutral path and maps it to VueFinder FsData. */
  const list = (neutralPath: string): Promise<VueFinderFsData> =>
    $fetch<FolderDto>(`${base}/list`, { params: { path: neutralPath } })
      .then(folder => toFsData(storage, folder))

  const toNeutral = (vueFinderPath: string | undefined): string =>
    toNeutralPath(storage, vueFinderPath)

  // Last successfully-listed folder, used to keep the view stable when a
  // navigation fails (VueFinder gives us no load-error hook — see header).
  let lastGood: VueFinderFsData | undefined

  return {
    async list(params?: VueFinderListParams): Promise<VueFinderFsData> {
      const neutralPath = toNeutral(params?.path)
      try {
        lastGood = await list(neutralPath)
        return lastGood
      }
      catch (error) {
        options.onLoadError?.(getErrorMessage(error))
        // Stay on the last good folder if we have one.
        if (lastGood)
          return lastGood
        // First load failed (e.g. a stale persisted path): fall back to the
        // storage root so the app is usable rather than stuck on a spinner.
        if (neutralPath !== '/') {
          lastGood = await list('/')
          return lastGood
        }
        throw error
      }
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

    async createFile(
      params: { path: string, name: string },
    ): Promise<VueFinderFileOperationResult> {
      await $fetch(`${base}/create-file`, {
        method: 'POST',
        body: { parentPath: toNeutral(params.path), name: params.name },
      })
      return list(toNeutral(params.path))
    },

    async save(params: { path: string, content: string }): Promise<string> {
      await $fetch(`${base}/save-file`, {
        method: 'POST',
        body: { path: toNeutral(params.path), content: params.content },
      })
      return params.path
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

    // Wire Uppy's XHR-upload plugin to our neutral upload endpoint.
    // VueFinder's local Driver type erases the Uppy instance to `unknown`;
    // cast it back to the real type at this boundary (the driver is the one
    // place that legitimately depends on Uppy).
    configureUploader(uppyInstance, context) {
      const uppy = uppyInstance as Uppy

      // Chunked upload via pCloud's upload-session API — not bounded by the
      // platform request-body limit, and reports real per-chunk progress.
      uppy.use(ChunkedUploader, {
        base,
        getTargetPath: () => toNeutral(context.getTargetPath()),
      })
    },

    // Disabled in the UI (features.archive / edit = false). Reject loudly
    // rather than pretend success, so a misconfig surfaces immediately.
    async archive(): Promise<VueFinderFileOperationResult> {
      throw new Error('Archive is not supported')
    },
    async unarchive(): Promise<VueFinderFileOperationResult> {
      throw new Error('Unarchive is not supported')
    },
  }
}
