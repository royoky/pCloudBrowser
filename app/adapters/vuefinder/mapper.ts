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
    return {
      ...base,
      type: 'file',
      extension: dto.extension,
      file_size: dto.size,
      mime_type: dto.mimeType,
      previewUrl: dto.thumbnailUrl,
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
