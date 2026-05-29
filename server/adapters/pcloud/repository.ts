/**
 * pCloud File Repository
 * 
 * This is the OUTBOUND ADAPTER in Hexagonal Architecture.
 * It implements the FileRepository port for pCloud storage.
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Only handles pCloud-specific operations
 * - Separation of Concerns: Delegates HTTP to PCloudClient, handles domain mapping
 * - Dependency Inversion: Implements FileRepository interface
 * - Meaningful Names: Methods and variables clearly express their purpose
 * - Pure Functions: Mapper methods are stateless
 */

import type {
  FileRepository,
  FileEntity,
  FolderEntity,
  FileSystemItem,
  FileOperationResult,
  ListOptions,
  TransferOptions,
  SearchOptions,
} from '../../../shared/domain/ports/file.repository';

import type { PCloudClient } from './client';
import type {
  PCloudListFolderResponse,
  PCloudCreateFolderResponse,
  PCloudRenameFolderResponse,
  PCloudDeleteFolderRecursiveResponse,
  PCloudCopyFileResponse,
  PCloudCopyFolderResponse,
  PCloudDeleteFileResponse,
  PCloudRenameFileResponse,
  PCloudFileLinkResponse,
  PCloudFileMetadata,
  PCloudFolderMetadata,
  PCloudItemMetadata,
} from '../../models/pcloud-api';

import { FileSystemPath, isFile, isFolder } from '../../../shared/domain/models/file-system.entity';
import { PCloudApiError } from './client';

/**
 * Configuration for the pCloud repository
 */
export interface PCloudRepositoryConfig {
  /** Base hostname for pCloud API */
  hostname: string;
  
  /** Authentication token for pCloud API */
  accessToken: string;
  
  /** Optional timeout in milliseconds */
  timeout?: number;
  
  /** Root folder ID for pCloud (default: 0) */
  rootFolderId?: string | number;
}

/**
 * Path to pCloud ID cache
 * This is a simple in-memory cache for path-to-ID lookups
 * In a production app, you might want a more sophisticated caching strategy
 */
class PathIdCache {
  private cache = new Map<string, string>();
  private reverseCache = new Map<string, string>();

  set(path: string, id: string): void {
    this.cache.set(path, id);
    this.reverseCache.set(id, path);
  }

  getId(path: string): string | undefined {
    return this.cache.get(path);
  }

  getPath(id: string): string | undefined {
    return this.reverseCache.get(id);
  }

  clear(): void {
    this.cache.clear();
    this.reverseCache.clear();
  }
}

/**
 * pCloud File Repository
 * 
 * Implements the FileRepository port for pCloud cloud storage.
 * This class:
 * - Uses PCloudClient for HTTP operations
 * - Maps pCloud responses to domain entities
 * - Handles path-to-ID conversions
 */
export class PCloudFileRepository implements FileRepository {
  private readonly client: PCloudClient;
  private readonly rootFolderId: string;
  private readonly pathIdCache: PathIdCache;

  constructor(config: PCloudRepositoryConfig) {
    this.client = new PCloudClient({
      hostname: config.hostname,
      accessToken: config.accessToken,
      timeout: config.timeout,
    });
    this.rootFolderId = (config.rootFolderId ?? 0).toString();
    this.pathIdCache = new PathIdCache();
  }

  // ========================================================================
  // Domain Entity Mapper Methods
  // These are PURE FUNCTIONS that convert pCloud data to domain entities
  // ========================================================================

  /**
   * Maps pCloud file metadata to domain FileEntity
   */
  private mapToFileEntity(
    pcloudItem: PCloudFileMetadata,
    parentPath: string
  ): FileEntity {
    const path = pcloudItem.path || FileSystemPath.join(parentPath, pcloudItem.name);
    const extension = pcloudItem.name.includes('.')
      ? pcloudItem.name.split('.').pop()!
      : '';

    return {
      id: pcloudItem.fileid.toString(),
      name: pcloudItem.name,
      path,
      type: 'file',
      createdAt: new Date(pcloudItem.created),
      modifiedAt: new Date(pcloudItem.modified),
      size: pcloudItem.size,
      mimeType: pcloudItem.contenttype,
      extension,
      hasThumbnail: pcloudItem.thumbready,
    };
  }

  /**
   * Maps pCloud folder metadata to domain FolderEntity
   */
  private mapToFolderEntity(
    pcloudItem: PCloudFolderMetadata,
    parentPath: string,
    children: FileSystemItem[] = []
  ): FolderEntity {
    const path = pcloudItem.path || FileSystemPath.join(parentPath, pcloudItem.name);

    return {
      id: pcloudItem.folderid.toString(),
      name: pcloudItem.name,
      path,
      type: 'folder',
      createdAt: new Date(pcloudItem.created),
      modifiedAt: new Date(pcloudItem.modified),
      itemCount: children.length,
      isLoaded: true,
    };
  }

  /**
   * Maps a pCloud item (file or folder) to a domain entity
   */
  private mapToEntity(
    pcloudItem: PCloudItemMetadata,
    parentPath: string
  ): FileSystemItem {
    if (pcloudItem.isfolder) {
      return this.mapToFolderEntity(pcloudItem, parentPath, []);
    }
    return this.mapToFileEntity(pcloudItem, parentPath);
  }

  /**
   * Converts a path to a pCloud folder/file ID
   * Uses cache when available, falls back to API lookup
   */
  private async pathToId(path: string): Promise<string> {
    // Check cache first
    const cachedId = this.pathIdCache.getId(path);
    if (cachedId) {
      return cachedId;
    }

    // For root path, return root folder ID
    if (path === '/') {
      return this.rootFolderId;
    }

    // Try to get ID from API
    try {
      const response = await this.client.getMetadata(path);
      const item = response.metadata;
      const id = item.isfolder ? item.folderid.toString() : item.fileid.toString();
      
      // Cache the result
      this.pathIdCache.set(path, id);
      
      return id;
    } catch (error) {
      // If we can't get the ID from path, we'll need to handle this differently
      // For now, we'll extract ID from path if it looks like a numeric ID
      if (/^\/\d+$/.test(path)) {
        return path.substring(1);
      }
      throw error;
    }
  }

  /**
   * Converts a pCloud ID to a path
   * Uses cache when available
   */
  private idToPath(id: string): string {
    const cachedPath = this.pathIdCache.getPath(id);
    if (cachedPath) {
      return cachedPath;
    }
    return `/${id}`; // Fallback
  }

  // ========================================================================
  // FileRepository Implementation
  // ========================================================================

  async list(path: string, options?: ListOptions): Promise<FolderEntity> {
    // Convert path to pCloud folder ID
    const folderId = await this.pathToId(path);
    
    // List the folder from pCloud
    const response = await this.client.listFolder(folderId);
    const pcloudFolder = response.metadata;
    
    // Build the folder path
    const folderPath = pcloudFolder.path || path;
    
    // Cache the path-ID mapping
    this.pathIdCache.set(folderPath, pcloudFolder.folderid.toString());
    
    // Map children to domain entities
    const children = (pcloudFolder.contents ?? []).map(item =>
      this.mapToEntity(item, folderPath)
    );

    // Create and return the folder entity
    return this.mapToFolderEntity(pcloudFolder, FileSystemPath.getParent(folderPath), children);
  }

  async getById(id: string): Promise<FileSystemItem | null> {
    try {
      // Get the path from cache or use ID as path
      const path = this.idToPath(id);
      const item = await this.getByPath(path);
      return item;
    } catch (error) {
      if (error instanceof PCloudApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getByPath(path: string): Promise<FileSystemItem | null> {
    try {
      // For root, we need special handling
      if (path === '/') {
        return this.list('/');
      }

      // Get metadata from pCloud
      const response = await this.client.getMetadata(path);
      const pcloudItem = response.metadata;
      
      // Build parent path
      const parentPath = FileSystemPath.getParent(path);
      
      // Map to domain entity
      return this.mapToEntity(pcloudItem, parentPath);
    } catch (error) {
      if (error instanceof PCloudApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async createFolder(parentPath: string, name: string): Promise<FolderEntity> {
    // Get parent folder ID
    const parentId = await this.pathToId(parentPath);
    
    // Create folder via pCloud API
    const response = await this.client.createFolder(parentId, name);
    const pcloudFolder = response.metadata;
    
    // Map to domain entity
    return this.mapToFolderEntity(
      pcloudFolder,
      FileSystemPath.join(parentPath, name)
    );
  }

  async uploadFile(
    parentPath: string,
    file: Blob | ArrayBuffer | Uint8Array,
    name: string
  ): Promise<FileEntity> {
    // Note: pCloud uses a multi-step upload process
    // For now, we'll need to use pCloud's upload API
    // This is a simplified implementation
    
    // Get parent folder ID
    const parentId = await this.pathToId(parentPath);
    
    // pCloud upload is complex - it requires:
    // 1. Get upload link
    // 2. Upload to that link
    // 3. Confirm upload
    
    // For now, we'll throw a not-implemented error
    // This would be implemented in a real app
    throw new Error('File upload not yet implemented for pCloud adapter');
  }

  async delete(path: string, permanent: boolean = false): Promise<FileOperationResult> {
    try {
      const item = await this.getByPath(path);
      
      if (!item) {
        return {
          success: false,
          error: `Item not found: ${path}`,
        };
      }

      const id = isFile(item) ? await this.pathToId(path) : await this.pathToId(path);
      
      if (isFile(item)) {
        await this.client.deleteFile(id);
      } else {
        await this.client.deleteFolder(id);
      }

      // Clear cache for this path
      this.pathIdCache.clear();

      return {
        success: true,
        item,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async rename(path: string, newName: string): Promise<FileSystemItem> {
    const item = await this.getByPath(path);
    
    if (!item) {
      throw new Error(`Item not found: ${path}`);
    }

    const parentPath = FileSystemPath.getParent(path);
    const parentId = await this.pathToId(parentPath);
    const itemId = isFile(item) ? await this.pathToId(path) : await this.pathToId(path);

    if (isFile(item)) {
      const response = await this.client.renameFile(itemId, newName);
      const pcloudFile = response.metadata;
      return this.mapToFileEntity(pcloudFile, parentPath);
    } else {
      const response = await this.client.renameFolder(itemId, newName);
      const pcloudFolder = response.metadata;
      return this.mapToFolderEntity(pcloudFolder, parentPath, []);
    }
  }

  async copy(
    sourcePath: string,
    options: TransferOptions
  ): Promise<FileOperationResult> {
    const sourceItem = await this.getByPath(sourcePath);
    
    if (!sourceItem) {
      return {
        success: false,
        error: `Source item not found: ${sourcePath}`,
      };
    }

    try {
      const sourceId = isFile(sourceItem) 
        ? await this.pathToId(sourcePath) 
        : await this.pathToId(sourcePath);
      const destinationId = await this.pathToId(options.destinationPath);

      if (isFile(sourceItem)) {
        await this.client.copyFile(
          sourceId,
          destinationId,
          options.newName
        );
      } else {
        await this.client.copyFolder(
          sourceId,
          destinationId,
          options.newName
        );
      }

      return {
        success: true,
        item: sourceItem,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async move(
    sourcePath: string,
    options: TransferOptions
  ): Promise<FileOperationResult> {
    const sourceItem = await this.getByPath(sourcePath);
    
    if (!sourceItem) {
      return {
        success: false,
        error: `Source item not found: ${sourcePath}`,
      };
    }

    try {
      const sourceId = isFile(sourceItem) 
        ? await this.pathToId(sourcePath) 
        : await this.pathToId(sourcePath);
      const destinationId = await this.pathToId(options.destinationPath);

      if (isFile(sourceItem)) {
        await this.client.moveFile(
          sourceId,
          destinationId,
          options.newName
        );
      } else {
        await this.client.moveFolder(
          sourceId,
          destinationId,
          options.newName
        );
      }

      // Clear cache since paths have changed
      this.pathIdCache.clear();

      return {
        success: true,
        item: sourceItem,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async search(options: SearchOptions): Promise<FileSystemItem[]> {
    // pCloud doesn't have a direct search API
    // We would need to:
    // 1. List the directory
    // 2. Filter locally
    // Or use pCloud's search if available
    
    // For now, implement a simple recursive search
    const items: FileSystemItem[] = [];
    const startPath = options.path ?? '/';
    
    async function searchRecursive(currentPath: string): Promise<void> {
      const folder = await this.list(currentPath);
      
      for (const child of folder.children ?? []) {
        // Check if name matches (simple contains check)
        if (child.name.toLowerCase().includes(options.query.toLowerCase())) {
          items.push(child);
        }

        // If it's a folder and we're searching recursively, search it
        if (isFolder(child) && options.recursive) {
          await searchRecursive(child.path);
        }
      }
    }

    await searchRecursive(startPath);
    
    return items;
  }

  async getDownloadUrl(path: string): Promise<string> {
    const item = await this.getByPath(path);
    
    if (!item || !isFile(item)) {
      throw new Error(`File not found: ${path}`);
    }

    const fileId = await this.pathToId(path);
    const response = await this.client.getFileLink(fileId);
    
    // Construct the full download URL
    return `https://${response.hosts[0]}${response.path}`;
  }

  async getPreviewUrl(path: string): Promise<string | null> {
    const item = await this.getByPath(path);
    
    if (!item || !isFile(item)) {
      return null;
    }

    // Check if file is previewable
    const previewableTypes = [
      'image/',
      'video/',
      'audio/',
      'text/',
      'application/pdf',
    ];

    const isPreviewable = previewableTypes.some(type =>
      item.mimeType.startsWith(type) || item.mimeType === type
    );

    if (!isPreviewable) {
      return null;
    }

    // For pCloud, if thumbready is true, we can use the thumbnail
    if (item.hasThumbnail) {
      const fileId = await this.pathToId(path);
      const response = await this.client.getFileLink(fileId);
      return `https://${response.hosts[0]}${response.path}`;
    }

    // Otherwise, use the regular file URL
    return this.getDownloadUrl(path);
  }

  async getContent(path: string): Promise<string> {
    const url = await this.getDownloadUrl(path);
    
    // Fetch the content and return as text
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }

    return response.text();
  }

  async exists(path: string): Promise<boolean> {
    try {
      const item = await this.getByPath(path);
      return item !== null;
    } catch (error) {
      if (error instanceof PCloudApiError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

/**
 * Factory function for creating pCloud repositories
 * Useful for dependency injection
 */
export function createPCloudRepository(
  config: PCloudRepositoryConfig
): FileRepository {
  return new PCloudFileRepository(config);
}
