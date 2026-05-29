/**
 * VueFinder Mapper
 * 
 * Maps domain entities to VueFinder's expected data structures.
 * These are PURE FUNCTIONS with no side effects.
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Each function does one mapping
 * - Pure Functions: No side effects, same input always gives same output
 * - Meaningful Names: Functions clearly express their purpose
 * - Small: Each function is focused and minimal
 */

import type {
  FileEntity,
  FolderEntity,
  FileSystemItem,
} from '../../../shared/domain/models/file-system.entity';

import type {
  VueFinderDirEntry,
  VueFinderFsData,
} from '../../../shared/types/vuefinder';

import { isFile, isFolder, FileSystemPath } from '../../../shared/domain/models/file-system.entity';

/**
 * Previewable MIME type prefixes
 * Files with these MIME types can be previewed in VueFinder
 */
const PREVIEWABLE_MIME_TYPES = [
  'image/',
  'video/',
  'audio/',
  'text/',
  'application/pdf',
  'application/json',
] as const;

/**
 * Checks if a file can be previewed based on its MIME type
 */
function canPreview(mimeType: string): boolean {
  return PREVIEWABLE_MIME_TYPES.some(type =>
    mimeType.startsWith(type) || mimeType === type
  );
}

/**
 * Maps a domain FileEntity to a VueFinder DirEntry
 */
export function mapFileEntityToDirEntry(
  file: FileEntity,
  storage: string
): VueFinderDirEntry {
  return {
    dir: FileSystemPath.getParent(file.path),
    basename: file.name,
    extension: file.extension,
    path: `${storage}:${file.path}`,
    storage,
    type: 'file',
    file_size: file.size,
    last_modified: file.modifiedAt.getTime(),
    mime_type: file.mimeType,
    read_only: false, // TODO: Determine from file permissions
    visibility: 'private', // TODO: Determine from file sharing settings
    previewUrl: canPreview(file.mimeType) ? undefined : undefined,
    // Note: previewUrl is intentionally left undefined here
    // It will be set by the driver's getPreviewUrl method when needed
  };
}

/**
 * Maps a domain FolderEntity to a VueFinder DirEntry
 */
export function mapFolderEntityToDirEntry(
  folder: FolderEntity,
  storage: string
): VueFinderDirEntry {
  return {
    dir: FileSystemPath.getParent(folder.path),
    basename: folder.name,
    extension: '',
    path: `${storage}:${folder.path}`,
    storage,
    type: 'dir',
    file_size: null,
    last_modified: folder.modifiedAt.getTime(),
    mime_type: null,
    read_only: false, // TODO: Determine from folder permissions
    visibility: 'private', // TODO: Determine from folder sharing settings
  };
}

/**
 * Maps any FileSystemItem to a VueFinder DirEntry
 */
export function mapFileSystemItemToDirEntry(
  item: FileSystemItem,
  storage: string
): VueFinderDirEntry {
  if (isFile(item)) {
    return mapFileEntityToDirEntry(item, storage);
  }
  return mapFolderEntityToDirEntry(item, storage);
}

/**
 * Maps a FolderEntity (with children) to VueFinder's FsData structure
 */
export function mapFolderEntityToFsData(
  folder: FolderEntity,
  storage: string
): VueFinderFsData {
  // Map all children to DirEntry
  const children = (folder.children ?? []).map(child =>
    mapFileSystemItemToDirEntry(child, storage)
  );

  // Sort children: folders first, then files, both alphabetically
  children.sort((a, b) => {
    // Folders come before files
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    // Same type: sort by name
    return a.basename.localeCompare(b.basename);
  });

  return {
    storages: [storage],
    dirname: folder.path,
    files: children,
    read_only: false, // TODO: Determine from folder permissions
  };
}

/**
 * Maps an array of FileSystemItem to VueFinder's FsData structure
 * Useful when you have a flat list of items without parent folder info
 */
export function mapFileSystemItemsToFsData(
  items: FileSystemItem[],
  dirname: string,
  storage: string
): VueFinderFsData {
  const files = items.map(item =>
    mapFileSystemItemToDirEntry(item, storage)
  );

  // Sort: folders first, then files, both alphabetically
  files.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    return a.basename.localeCompare(b.basename);
  });

  return {
    storages: [storage],
    dirname,
    files,
    read_only: false,
  };
}

/**
 * Creates a VueFinder DirEntry for the root folder
 */
export function createRootDirEntry(storage: string): VueFinderDirEntry {
  return {
    dir: '',
    basename: storage,
    extension: '',
    path: `${storage}:/`,
    storage,
    type: 'dir',
    file_size: null,
    last_modified: null,
    mime_type: null,
    read_only: false,
    visibility: 'private',
  };
}
