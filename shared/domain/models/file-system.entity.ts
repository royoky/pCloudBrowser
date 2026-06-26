/**
 * File System Domain Entities
 *
 * These are the core domain models for the file system.
 * They are completely framework-agnostic and technology-agnostic.
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Each type represents one concept
 * - Meaningful Names: Types and properties clearly express their purpose
 * - Small: Each type is focused and minimal
 * - Immutable: Entities should be treated as immutable (no mutation methods)
 */

/**
 * Base type for all file system items
 * Uses discriminated union pattern for type safety
 */
export type FileSystemItemType = 'file' | 'folder'

/**
 * Base interface for all file system entities
 * Contains common properties shared by files and folders
 */
export interface FileSystemItemBase {
  /** Unique identifier for the item */
  id: string

  /** Human-readable name of the item */
  name: string

  /** Full path to the item (e.g., '/Documents/Report.pdf') */
  path: string

  /** Type discriminator for the union type */
  type: FileSystemItemType

  /** When the item was created */
  createdAt: Date

  /** When the item was last modified */
  modifiedAt: Date
}

/**
 * Represents a file in the file system
 */
export interface FileEntity extends FileSystemItemBase {
  type: 'file'

  /** Size of the file in bytes */
  size: number

  /** MIME type of the file (e.g., 'image/png', 'application/pdf') */
  mimeType: string

  /** File extension without the dot (e.g., 'pdf', 'jpg') */
  extension: string

  /** Whether a thumbnail is available for this file (e.g. pCloud thumb flag). */
  hasThumbnail?: boolean
}

/**
 * Represents a folder in the file system
 */
export interface FolderEntity extends FileSystemItemBase {
  type: 'folder'

  /** Number of direct children in this folder */
  itemCount: number

  /**
   * Flag indicating if the folder has been fully loaded with children
   * Used for lazy loading optimization
   */
  isLoaded?: boolean

  /**
   * Child items in this folder
   * Only populated when the folder is loaded
   */
  children?: FileSystemItem[]
}

/**
 * Union type of all file system items
 * Enables type-safe discrimination between files and folders
 */
export type FileSystemItem = FileEntity | FolderEntity

/**
 * Type guard to check if an item is a file
 */
export function isFile(item: FileSystemItem): item is FileEntity {
  return item.type === 'file'
}

/**
 * Type guard to check if an item is a folder
 */
export function isFolder(item: FileSystemItem): item is FolderEntity {
  return item.type === 'folder'
}

/**
 * Path utility functions for domain entities
 * Pure functions with no side effects
 */
export const FileSystemPath = {
  /**
   * Extracts the parent path from a given path
   * @example FileSystemPath.getParent('/a/b/c') => '/a/b'
   */
  getParent(path: string): string {
    if (path === '/')
      return '/'
    const segments = path.split('/').filter(Boolean)
    return segments.length <= 1 ? '/' : `/${segments.slice(0, -1).join('/')}`
  },

  /**
   * Extracts the basename (filename/foldername) from a path
   * @example FileSystemPath.getBasename('/a/b/c.txt') => 'c.txt'
   */
  getBasename(path: string): string {
    const segments = path.split('/').filter(Boolean)
    return segments.at(-1) || path
  },

  /**
   * Joins path segments
   * @example FileSystemPath.join('/a/b', 'c') => '/a/b/c'
   */
  join(...segments: string[]): string {
    return segments
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/')
      .replace(/^\//, '/')
      .replace(/\/$/, '') || '/'
  },

  /**
   * Checks if a path is the root path
   */
  isRoot(path: string): boolean {
    return path === '/'
  },
}
