/**
 * VueFinder Driver Implementation
 * 
 * This is an INBOUND ADAPTER in Hexagonal Architecture.
 * It implements VueFinder's Driver interface using our FileRepository port.
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Only converts between FileRepository and VueFinder formats
 * - Separation of Concerns: Doesn't know about pCloud or HTTP details
 * - Dependency Inversion: Depends on FileRepository abstraction
 * - Pure Functions: Mapper functions are stateless
 * - Error Handling: Consistent error handling
 */

import type { FileRepository } from '../../../shared/domain/ports/file.repository';
import type {
  VueFinderDriver,
  VueFinderFsData,
  VueFinderDirEntry,
  VueFinderListParams,
  VueFinderDeleteParams,
  VueFinderRenameParams,
  VueFinderTransferParams,
  VueFinderArchiveParams,
  VueFinderSaveParams,
  VueFinderSearchParams,
  VueFinderFileOperationResult,
  VueFinderDeleteResult,
  VueFinderFileContentResult,
  VueFinderUploaderContext,
} from '../../../shared/types/vuefinder';

import { isFile } from '../../../shared/domain/models/file-system.entity';
import {
  mapFolderEntityToFsData,
  mapFileSystemItemToDirEntry,
  createRootDirEntry,
} from './mapper';

/**
 * Configuration for creating a VueFinder driver
 */
export interface VueFinderDriverConfig {
  /** The file repository to use for data operations */
  repository: FileRepository;
  
  /** Storage name to use in VueFinder paths (e.g., 'pcloud') */
  storageName: string;
  
  /** Optional custom uploader configuration */
  configureUploader?: (
    uppy: unknown,
    context: VueFinderUploaderContext
  ) => void;
}

/**
 * Creates a VueFinder-compatible driver from a FileRepository
 * 
 * This function implements the VueFinder Driver interface by:
 * 1. Using the FileRepository for data operations
 * 2. Mapping domain entities to VueFinder's expected formats
 * 3. Handling path conversions between formats
 */
export function createVueFinderDriver(
  config: VueFinderDriverConfig
): VueFinderDriver {
  const { repository, storageName, configureUploader } = config;

  // Helper to extract path from VueFinder's storage:path format
  const extractPath = (vueFinderPath: string | undefined): string => {
    if (!vueFinderPath) return '/';
    return vueFinderPath.replace(`${storageName}:`, '') || '/';
  };

  // Helper to extract ID from a path
  const extractIdFromPath = (path: string): string => {
    // If path is just an ID (numeric), return it
    if (/^\/\d+$/.test(path)) {
      return path.substring(1);
    }
    // Otherwise, return the basename or full path
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] || path;
  };

  return {
    // Optional uploader configuration
    configureUploader,

    // List files and folders in a directory
    async list(params?: VueFinderListParams): Promise<VueFinderFsData> {
      const path = extractPath(params?.path);
      
      try {
        const folder = await repository.list(path);
        return mapFolderEntityToFsData(folder, storageName);
      } catch (error) {
        // If we can't list the path, return an empty directory
        // This could happen for invalid paths
        console.error('Failed to list directory:', error);
        return {
          storages: [storageName],
          dirname: path,
          files: [],
          read_only: false,
        };
      }
    },

    // Delete one or more files or folders
    async delete(params: VueFinderDeleteParams): Promise<VueFinderDeleteResult> {
      const deletedEntries: VueFinderDirEntry[] = [];
      
      // Process each item to delete
      for (const item of params.items) {
        const path = extractPath(item.path);
        
        try {
          await repository.delete(path);
          deletedEntries.push(item);
        } catch (error) {
          console.error(`Failed to delete ${item.path}:`, error);
          // Continue with other items even if one fails
        }
      }

      // Return refreshed directory listing
      const listResult = await this.list({ path: params.path });
      
      return {
        ...listResult,
        deleted: deletedEntries.length > 0 ? deletedEntries : undefined,
      };
    },

    // Rename a file or folder
    async rename(params: VueFinderRenameParams): Promise<VueFinderFileOperationResult> {
      const path = extractPath(params.path);
      const itemPath = extractPath(params.item);
      const fullItemPath = `${path}/${itemPath}`;
      
      await repository.rename(fullItemPath, params.name);
      
      // Return refreshed directory listing
      return this.list({ path });
    },

    // Copy one or more files or folders
    async copy(params: VueFinderTransferParams): Promise<VueFinderFileOperationResult> {
      for (const sourcePath of params.sources) {
        const extractedPath = extractPath(sourcePath);
        const destinationPath = extractPath(params.destination);
        
        await repository.copy(extractedPath, {
          destinationPath,
          newName: params.destination.split('/').pop(),
        });
      }
      
      // Return refreshed directory listing for destination
      return this.list({ path: params.destination });
    },

    // Move one or more files or folders
    async move(params: VueFinderTransferParams): Promise<VueFinderFileOperationResult> {
      for (const sourcePath of params.sources) {
        const extractedPath = extractPath(sourcePath);
        const destinationPath = extractPath(params.destination);
        
        await repository.move(extractedPath, {
          destinationPath,
          newName: params.destination.split('/').pop(),
        });
      }
      
      // Return refreshed directory listing for destination
      return this.list({ path: params.destination });
    },

    // Create a zip archive
    async archive(params: VueFinderArchiveParams): Promise<VueFinderFileOperationResult> {
      // Note: Our FileRepository doesn't have an archive method
      // This would need to be added if we want to support this feature
      console.warn('Archive operation not yet implemented');
      return this.list({ path: params.path });
    },

    // Extract files from a zip archive
    async unarchive(params: { item: string; path: string }): Promise<VueFinderFileOperationResult> {
      // Note: Our FileRepository doesn't have an unarchive method
      console.warn('Unarchive operation not yet implemented');
      return this.list({ path: params.path });
    },

    // Create a new empty file
    async createFile(params: { path: string; name: string }): Promise<VueFinderFileOperationResult> {
      const path = extractPath(params.path);
      const fullPath = `${path}/${params.name}`;
      
      // Note: We need to create an empty file
      // This would require a new method on FileRepository
      console.warn('Create file operation not yet implemented');
      return this.list({ path });
    },

    // Create a new empty folder
    async createFolder(params: { path: string; name: string }): Promise<VueFinderFileOperationResult> {
      const path = extractPath(params.path);
      
      await repository.createFolder(path, params.name);
      
      // Return refreshed directory listing
      return this.list({ path });
    },

    // Get the text content of a file
    async getContent(params: { path: string }): Promise<VueFinderFileContentResult> {
      const path = extractPath(params.path);
      const content = await repository.getContent(path);
      
      return {
        content,
        mimeType: undefined, // Could be enhanced to return actual MIME type
      };
    },

    // Get a URL for previewing a file
    getPreviewUrl(params: { path: string }): string {
      const path = extractPath(params.path);
      
      // For now, we'll return a placeholder URL
      // In a real implementation, this would call the repository
      // and return the actual preview URL
      // Note: We can't make async calls in this synchronous method
      return `/api/files/preview?path=${encodeURIComponent(path)}`;
    },

    // Get a URL for downloading a file
    getDownloadUrl(params: { path: string }): string {
      const path = extractPath(params.path);
      return `/api/files/download?path=${encodeURIComponent(path)}`;
    },

    // Search for files and folders
    async search(params: VueFinderSearchParams): Promise<VueFinderDirEntry[]> {
      const searchPath = extractPath(params.path);
      
      const results = await repository.search({
        query: params.filter,
        path: searchPath,
        recursive: params.deep,
        type: 'both',
      });

      // Map results to VueFinder DirEntry format
      return results.map(item =>
        mapFileSystemItemToDirEntry(item, storageName)
      );
    },

    // Save text content to a file
    async save(params: VueFinderSaveParams): Promise<string> {
      const path = extractPath(params.path);
      
      // Note: Our FileRepository doesn't have a save method
      // This would need to be added to support file editing
      console.warn('Save operation not yet implemented');
      
      return path;
    },
  };
}

/**
 * Default configuration for creating a pCloud VueFinder driver
 * This can be used when you want to create a driver with default settings
 */
export interface PCloudVueFinderDriverConfig extends VueFinderDriverConfig {
  storageName?: string;
}

/**
 * Convenience function for creating a pCloud-specific VueFinder driver
 */
export function createPCloudVueFinderDriver(
  repository: FileRepository,
  config?: PCloudVueFinderDriverConfig
): VueFinderDriver {
  return createVueFinderDriver({
    repository,
    storageName: config?.storageName ?? 'pcloud',
    configureUploader: config?.configureUploader,
  });
}
