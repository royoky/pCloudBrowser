/**
 * File Repository Port
 *
 * This is the OUTBOUND PORT in Hexagonal Architecture.
 * It defines the contract for how the application interacts with file storage systems.
 *
 * Clean Code Principles Applied:
 * - Interface Segregation: Small, focused interface with clear responsibilities
 * - Dependency Inversion: Depend on abstractions, not concretions
 * - Meaningful Names: Methods clearly express their intent
 * - Single Responsibility: Each method does one thing
 */

import type {
  FileEntity,
  FileSystemItem,
  FolderEntity,
} from '~~/shared/domain/models/file-system.entity'

// Re-export types for convenience
export type { FileEntity, FileSystemItem, FolderEntity }

/**
 * Parameters for listing items in a directory
 */
export interface ListOptions {
  /** Whether to include deleted items */
  includeDeleted?: boolean
  /** Whether to recursively list all subdirectories */
  recursive?: boolean
  /** Maximum number of items to return */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Sort order */
  sortBy?: 'name' | 'date' | 'size' | 'type'
  sortDirection?: 'asc' | 'desc'
}

/**
 * Parameters for creating a new folder
 */
export interface CreateFolderOptions {
  /** Path to the parent directory */
  parentPath: string
  /** Name of the new folder */
  name: string
}

/**
 * Parameters for creating a new file
 */
export interface CreateFileOptions {
  /** Path to the parent directory */
  parentPath: string
  /** Name of the new file */
  name: string
}

/**
 * Parameters for writing file content
 */
export interface WriteFileContentOptions {
  /** Path to the file */
  path: string
  /** The text content to write */
  content: string
}

/**
 * Parameters for creating a new item (legacy - prefer CreateFolderOptions/CreateFileOptions)
 */
export interface CreateOptions {
  /** Name of the new item */
  name: string
  /** For files: the content to upload */
  content?: Blob | ArrayBuffer | Uint8Array
  /** For files: MIME type */
  mimeType?: string
}

/**
 * Parameters for copying or moving items
 */
export interface TransferOptions {
  /** Destination path */
  destinationPath: string
  /** Optional new name for the item */
  newName?: string
  /** Whether to overwrite if destination exists */
  overwrite?: boolean
}

/**
 * Result of a file operation
 */
export interface FileOperationResult {
  /** Whether the operation succeeded */
  success: boolean
  /** The item that was affected (if available) */
  item?: FileSystemItem
  /** Error message if operation failed */
  error?: string
}

/**
 * Search parameters
 */
export interface SearchOptions {
  /** Search query */
  query: string
  /** Path to search within */
  path?: string
  /** Whether to search recursively */
  recursive?: boolean
  /** File type filter */
  type?: 'file' | 'folder' | 'both'
}

/**
 * File Repository Port Interface
 *
 * This interface defines the contract for file system operations.
 * All cloud storage adapters (pCloud, Google Drive, etc.) must implement this interface.
 */
export interface FileRepository {
  /**
   * Lists all items in a directory
   *
   * @param path - The path to the directory to list
   * @param options - Additional listing options
   * @returns Promise resolving to the directory and its items
   */
  list: (path: string, options?: ListOptions) => Promise<FolderEntity>

  /**
   * Gets a specific file or folder by its ID
   *
   * @param id - The unique identifier of the item
   * @returns Promise resolving to the file or folder, or null if not found
   */
  getById: (id: string) => Promise<FileSystemItem | null>

  /**
   * Gets a specific file or folder by its path
   *
   * @param path - The full path to the item
   * @returns Promise resolving to the file or folder, or null if not found
   */
  getByPath: (path: string) => Promise<FileSystemItem | null>

  /**
   * Creates a new folder
   *
   * @param options - Folder creation parameters
   * @returns Promise resolving to the created folder
   */
  createFolder: (options: CreateFolderOptions) => Promise<FolderEntity>

  /**
   * Creates a new empty file
   *
   * @param options - File creation parameters
   * @returns Promise resolving to the created file
   */
  createFile: (options: CreateFileOptions) => Promise<FileEntity>

  /**
   * Writes content to a file (creates or overwrites)
   *
   * @param options - File write parameters
   * @returns Promise resolving to the updated file
   */
  writeFileContent: (options: WriteFileContentOptions) => Promise<FileEntity>

  /**
   * Opens a resumable upload session.
   * @returns An opaque upload session id, referenceable across requests.
   */
  createUpload: () => Promise<string>

  /**
   * Writes a chunk of data to an open upload session at a byte offset.
   *
   * @param uploadId - Session id from `createUpload`
   * @param offset - Byte offset within the final file
   * @param data - Chunk bytes
   */
  writeUploadChunk: (uploadId: string, offset: number, data: Uint8Array) => Promise<void>

  /**
   * Finalizes an upload session into a file in the target directory.
   *
   * @param uploadId - Session id from `createUpload`
   * @param parentPath - Path to the parent directory
   * @param name - Name of the new file
   */
  saveUpload: (uploadId: string, parentPath: string, name: string) => Promise<FileEntity>

  /**
   * Deletes a file or folder
   *
   * @param path - Path to the item to delete
   * @param permanent - Whether to permanently delete or move to trash
   * @returns Promise resolving to the operation result
   */
  delete: (path: string, permanent?: boolean) => Promise<FileOperationResult>

  /**
   * Renames a file or folder
   *
   * @param path - Path to the item to rename
   * @param newName - New name for the item
   * @returns Promise resolving to the renamed item
   */
  rename: (path: string, newName: string) => Promise<FileSystemItem>

  /**
   * Copies a file or folder
   *
   * @param sourcePath - Path to the source item
   * @param options - Copy options including destination
   * @returns Promise resolving to the operation result
   */
  copy: (
    sourcePath: string,
    options: TransferOptions,
  ) => Promise<FileOperationResult>

  /**
   * Moves a file or folder
   *
   * @param sourcePath - Path to the source item
   * @param options - Move options including destination
   * @returns Promise resolving to the operation result
   */
  move: (
    sourcePath: string,
    options: TransferOptions,
  ) => Promise<FileOperationResult>

  /**
   * Searches for files and folders
   *
   * @param options - Search parameters
   * @returns Promise resolving to matching items
   */
  search: (options: SearchOptions) => Promise<FileSystemItem[]>

  /**
   * Gets the download URL for a file
   *
   * @param path - Path to the file
   * @returns Promise resolving to the download URL
   */
  getDownloadUrl: (path: string) => Promise<string>

  /**
   * Gets the preview URL for a file (if previewable)
   *
   * @param path - Path to the file
   * @returns Promise resolving to the preview URL, or null if not previewable
   */
  getPreviewUrl: (path: string, thumb?: boolean) => Promise<string | null>

  /**
   * Gets a streaming URL for media files (e.g., an HLS m3u8 playlist).
   * Returns null if the provider doesn't support media streaming
   * or the file is not a streamable media type.
   *
   * @param path - Path to the file
   */
  getStreamUrl: (path: string) => Promise<string | null>

  /**
   * Gets the content of a text file
   *
   * @param path - Path to the file
   * @returns Promise resolving to the file content as string
   */
  getContent: (path: string) => Promise<string>

  /**
   * Checks if an item exists
   *
   * @param path - Path to check
   * @returns Promise resolving to whether the item exists
   */
  exists: (path: string) => Promise<boolean>
}

/**
 * Factory function type for creating repositories
 * Useful for dependency injection
 */
export type FileRepositoryFactory = (
  config: Record<string, unknown>,
) => FileRepository
