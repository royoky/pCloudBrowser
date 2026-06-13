/**
 * File-System Presenter
 *
 * Maps domain entities (server-only, with real `Date` objects) to the neutral
 * wire DTOs. This is the serialization boundary: `Date` becomes an ISO string
 * here, exactly once, so no consumer ever calls `.getTime()` on a raw response.
 *
 * Pure functions, no side effects.
 */

import type {
  FileSystemItemDto,
  FolderDto,
  OperationResultDto,
} from '~~/shared/contracts/file-system.dto'

import type {
  FileEntity,
  FileSystemItem,
  FolderEntity,
} from '~~/shared/domain/models/file-system.entity'

import type { FileOperationResult } from '~~/shared/domain/ports/file.repository'

import { isFile } from '~~/shared/domain/models/file-system.entity'

function toFileDto(file: FileEntity): FileSystemItemDto {
  return {
    id: file.id,
    name: file.name,
    path: file.path,
    type: 'file',
    createdAt: file.createdAt.toISOString(),
    modifiedAt: file.modifiedAt.toISOString(),
    size: file.size,
    mimeType: file.mimeType,
    extension: file.extension,
    hasThumbnail: file.hasThumbnail,
  }
}

function toFolderDto(folder: FolderEntity): FolderDto {
  return {
    id: folder.id,
    name: folder.name,
    path: folder.path,
    type: 'folder',
    createdAt: folder.createdAt.toISOString(),
    modifiedAt: folder.modifiedAt.toISOString(),
    itemCount: folder.itemCount,
  }
}

/** Maps any file-system item to its DTO. */
export function toItemDto(item: FileSystemItem): FileSystemItemDto {
  return isFile(item) ? toFileDto(item) : toFolderDto(item)
}

/** Maps a folder to a DTO including its direct children (for `/list`). */
export function toFolderListing(folder: FolderEntity): FolderDto {
  return {
    ...toFolderDto(folder),
    children: (folder.children ?? []).map(toItemDto),
  }
}

/** Maps a port `FileOperationResult` to a per-item batch outcome. */
export function toOperationResult(
  path: string,
  result: FileOperationResult,
): OperationResultDto {
  return {
    path,
    success: result.success,
    item: result.item ? toItemDto(result.item) : undefined,
    error: result.error,
  }
}
