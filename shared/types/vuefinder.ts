/**
 * VueFinder Type Definitions
 * 
 * These are LOCAL COPIES of VueFinder's type definitions.
 * We define them here to:
 * 1. Avoid server-side dependency on VueFinder
 * 2. Have explicit control over our type contracts
 * 3. Make it clear what we expect from VueFinder
 * 
 * If VueFinder's types change, we update these locally.
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Each type represents one concept
 * - Meaningful Names: Types clearly express their purpose
 * - DRY: We don't duplicate logic, just type shapes
 * - Explicit > Implicit: Types are clearly defined
 */

// ============================================================================
// VueFinder Core Types
// ============================================================================

/**
 * Represents a single file or folder entry in VueFinder
 * This is the primary data structure VueFinder expects
 */
export interface VueFinderDirEntry {
  /** The directory path containing this entry */
  dir: string;
  
  /** The name of the file or folder without the full path */
  basename: string;
  
  /** File extension (empty for folders) */
  extension: string;
  
  /** Full path including storage prefix (e.g., "pcloud:/Documents/file.txt") */
  path: string;
  
  /** Storage identifier (e.g., "pcloud", "local") */
  storage: string;
  
  /** Entry type: 'file' or 'dir' */
  type: 'file' | 'dir';
  
  /** File size in bytes (null for folders) */
  file_size: number | null;
  
  /** Last modified timestamp (Unix timestamp in milliseconds, null if unavailable) */
  last_modified: number | null;
  
  /** MIME type (null for folders or unknown types) */
  mime_type: string | null;
  
  /** Whether the entry is read-only */
  read_only?: boolean;
  
  /** Visibility status (e.g., "public", "private") */
  visibility: string;
  
  /** Optional custom preview URL - if provided, overrides the adapter's getPreviewUrl() */
  previewUrl?: string;
}

/**
 * File system data response from VueFinder's list operation
 * Represents a directory and its contents
 */
export interface VueFinderFsData {
  /** Array of available storage names */
  storages: string[];
  
  /** Current directory name/path */
  dirname: string;
  
  /** Array of file and folder entries in the directory */
  files: VueFinderDirEntry[];
  
  /** Whether the current path is read-only */
  read_only?: boolean;
}

// ============================================================================
// VueFinder Driver Method Parameters
// ============================================================================

/** Parameters for the list method */
export interface VueFinderListParams {
  /** The directory path to list */
  path?: string;
}

/** Parameters for the delete method */
export interface VueFinderDeleteParams {
  /** The current directory path where items are located */
  path: string;
  
  /** Array of items to delete */
  items: VueFinderItemToDelete[];
}

/** An item to delete (part of DeleteParams) */
export interface VueFinderItemToDelete {
  /** Full path to the item */
  path: string;
  
  /** Item type: 'file' or 'dir' */
  type: 'file' | 'dir';
}

/** Parameters for the rename method */
export interface VueFinderRenameParams {
  /** The current directory path where the item is located */
  path: string;
  
  /** Current name/path of the item to rename (relative to path) */
  item: string;
  
  /** New name for the item (without path) */
  name: string;
}

/** Parameters for copy/move operations */
export interface VueFinderTransferParams {
  /** Array of full paths to items to copy/move */
  sources: string[];
  
  /** Full destination path where items should be copied/moved to */
  destination: string;
}

/** Parameters for archive creation */
export interface VueFinderArchiveParams {
  /** Array of items to include in archive */
  items: VueFinderArchiveItem[];
  
  /** Directory path where the archive should be created */
  path: string;
  
  /** Name for the archive file */
  name: string;
}

/** An item to include in an archive */
export interface VueFinderArchiveItem {
  /** Full path to the item */
  path: string;
  
  /** Item type: 'file' or 'dir' */
  type: 'file' | 'dir';
}

/** Parameters for the save method */
export interface VueFinderSaveParams {
  /** Full file path where content should be saved */
  path: string;
  
  /** The content to save */
  content: string;
}

/** Parameters for the search method */
export interface VueFinderSearchParams {
  /** Search query string */
  filter: string;
  
  /** Optional base path to search within */
  path?: string;
  
  /** Optional flag to search in subdirectories recursively */
  deep?: boolean;
  
  /** Optional file size filter */
  size?: 'all' | 'small' | 'medium' | 'large';
}

// ============================================================================
// VueFinder Driver Method Return Types
// ============================================================================

/** Result of delete operation */
export interface VueFinderDeleteResult extends VueFinderFileOperationResult {
  /** Optional array of deleted items */
  deleted?: VueFinderDirEntry[];
}

/** Base result of file operations (list, create, delete, rename, copy, move) */
export interface VueFinderFileOperationResult {
  /** Array of files in the current directory after operation */
  files: VueFinderDirEntry[];
  
  /** Available storage identifiers */
  storages: string[];
  
  /** Whether the current path is read-only */
  read_only: boolean;
  
  /** Current directory name/path */
  dirname: string;
}

/** Result of file content operations */
export interface VueFinderFileContentResult {
  /** The file content as a string */
  content: string;
  
  /** Optional MIME type of the file content */
  mimeType?: string;
}

// ============================================================================
// VueFinder Driver Interface
// ============================================================================

/**
 * Uploader context provided to configureUploader
 */
export interface VueFinderUploaderContext {
  /** Function that returns the current target path for uploads */
  getTargetPath: () => string;
}

/**
 * The Driver interface that all VueFinder drivers must implement
 * This is a LOCAL COPY for type safety without server-side dependencies
 */
export interface VueFinderDriver {
  /** Optional: Configure the Uppy uploader instance */
  configureUploader?: (
    uppy: unknown,
    context: VueFinderUploaderContext
  ) => void;

  /** List files and folders in a directory */
  list(params?: VueFinderListParams): Promise<VueFinderFsData>;

  /** Delete one or more files or folders */
  delete(params: VueFinderDeleteParams): Promise<VueFinderDeleteResult>;

  /** Rename a file or folder */
  rename(params: VueFinderRenameParams): Promise<VueFinderFileOperationResult>;

  /** Copy one or more files or folders */
  copy(params: VueFinderTransferParams): Promise<VueFinderFileOperationResult>;

  /** Move one or more files or folders */
  move(params: VueFinderTransferParams): Promise<VueFinderFileOperationResult>;

  /** Create a zip archive */
  archive(params: VueFinderArchiveParams): Promise<VueFinderFileOperationResult>;

  /** Extract files from a zip archive */
  unarchive(params: { item: string; path: string }): Promise<VueFinderFileOperationResult>;

  /** Create a new empty file */
  createFile(params: { path: string; name: string }): Promise<VueFinderFileOperationResult>;

  /** Create a new empty folder */
  createFolder(params: { path: string; name: string }): Promise<VueFinderFileOperationResult>;

  /** Get the text content of a file */
  getContent(params: { path: string }): Promise<VueFinderFileContentResult>;

  /** Get a URL for previewing a file */
  getPreviewUrl(params: { path: string }): string;

  /** Get a URL for downloading a file */
  getDownloadUrl(params: { path: string }): string;

  /** Search for files and folders */
  search(params: VueFinderSearchParams): Promise<VueFinderDirEntry[]>;

  /** Save text content to a file */
  save(params: VueFinderSaveParams): Promise<string>;
}

// ============================================================================
// Utility Type Guards
// ============================================================================

/** Type guard to check if a DirEntry is a file */
export function isVueFinderFile(entry: VueFinderDirEntry): boolean {
  return entry.type === 'file';
}

/** Type guard to check if a DirEntry is a directory */
export function isVueFinderDir(entry: VueFinderDirEntry): boolean {
  return entry.type === 'dir';
}
