/**
 * Neutral DTO -> VueFinder mapper (client side).
 *
 * The inverse of the server presenter: turns neutral wire DTOs into the shapes
 * VueFinder renders. Pure functions. ISO timestamps become epoch-ms here, since
 * VueFinder's `last_modified` is a number.
 */

import type {
  FileSystemItemDto,
  FolderDto,
} from '~~/shared/contracts/file-system.dto'

import type {
  VueFinderDirEntry,
  VueFinderFsData,
} from '~~/shared/types/vuefinder'

import { neutralParent, toVueFinderPath } from './path'

/** Maps a single neutral item DTO to a VueFinder directory entry. */
export function toDirEntry(storage: string, dto: FileSystemItemDto): VueFinderDirEntry {
  const base = {
    dir: toVueFinderPath(storage, neutralParent(dto.path)),
    basename: dto.name,
    path: toVueFinderPath(storage, dto.path),
    storage,
    last_modified: Date.parse(dto.modifiedAt),
    read_only: false,
    visibility: 'private',
  }

  if (dto.type === 'file') {
    const previewUrl = `/api/${storage}/preview?path=${encodeURIComponent(dto.path)}`
    return {
      ...base,
      type: 'file',
      extension: dto.extension,
      file_size: dto.size,
      mime_type: dto.mimeType,
      // Route previews through our proxy: direct CDN URLs (eth*.pcloud.com)
      // get blocked by ORB when the browser auto-sends pCloud cookies cross-site.
      // The grid uses a scaled thumbnail (served as bytes by the API, so no
      // IP-bound link); the preview and edit modals use the full-size image.
      // `thumbnailUrl` needs VueFinder >= 4.8.0: older versions ignore it and
      // the grid would load the full-size images.
      ...(dto.hasThumbnail && {
        previewUrl,
        ...(dto.mimeType.startsWith('image/') && { thumbnailUrl: `${previewUrl}&thumb=1` }),
      }),
    }
  }

  return {
    ...base,
    type: 'dir',
    extension: '',
    file_size: null,
    mime_type: null,
  }
}

/** Maps a neutral folder listing to VueFinder's FsData. */
export function toFsData(storage: string, folder: FolderDto): VueFinderFsData {
  return {
    storages: [storage],
    dirname: toVueFinderPath(storage, folder.path),
    files: (folder.children ?? []).map(child => toDirEntry(storage, child)),
    read_only: false,
  }
}
