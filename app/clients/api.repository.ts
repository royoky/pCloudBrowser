/**
 * API Client Repository
 * 
 * This is an INBOUND ADAPTER in Hexagonal Architecture.
 * It implements the FileRepository port by calling the Nuxt API endpoints.
 * 
 * This allows the frontend to use the same FileRepository interface
 * as the backend, maintaining a clean separation of concerns.
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Only handles HTTP calls to our API
 * - Separation of Concerns: Doesn't know about pCloud or VueFinder
 * - Dependency Inversion: Implements FileRepository interface
 * - Error Handling: Consistent error handling
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
} from '../../shared/domain/ports/file.repository';

import { isFile, isFolder } from '../../shared/domain/models/file-system.entity';

/**
 * API Client Repository
 * 
 * Implements FileRepository by making HTTP calls to our Nuxt API.
 * This is the bridge between the frontend and the backend.
 */
export class ApiFileRepository implements FileRepository {
  private readonly basePath: string;

  constructor(basePath: string = '/api/files') {
    this.basePath = basePath;
  }

  /**
   * Helper to handle API errors consistently
   */
  private async handleApiError(error: unknown): Promise<never> {
    if (error instanceof Error) {
      throw new Error(`API Error: ${error.message}`);
    }
    throw new Error('Unknown API error');
  }

  async list(path: string, options?: ListOptions): Promise<FolderEntity> {
    try {
      // For root path, use a special endpoint or default
      const listPath = path === '/' ? '' : path;
      
      const response = await $fetch<FolderEntity>(
        `${this.basePath}/${listPath}`,
        {
          method: 'GET',
          params: {
            includeDeleted: options?.includeDeleted,
            recursive: options?.recursive,
            limit: options?.limit,
            offset: options?.offset,
            sortBy: options?.sortBy,
            sortDirection: options?.sortDirection,
          },
        }
      );

      return response;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getById(id: string): Promise<FileSystemItem | null> {
    try {
      const response = await $fetch<FileSystemItem | null>(
        `${this.basePath}/by-id/${id}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      if (
        error instanceof Error && 
        (error.message.includes('404') || error.message.includes('not found'))
      ) {
        return null;
      }
      return this.handleApiError(error);
    }
  }

  async getByPath(path: string): Promise<FileSystemItem | null> {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await $fetch<FileSystemItem | null>(
        `${this.basePath}/by-path`,
        {
          method: 'GET',
          params: { path: encodedPath },
        }
      );
      return response;
    } catch (error) {
      if (
        error instanceof Error && 
        (error.message.includes('404') || error.message.includes('not found'))
      ) {
        return null;
      }
      return this.handleApiError(error);
    }
  }

  async createFolder(parentPath: string, name: string): Promise<FolderEntity> {
    try {
      const encodedPath = encodeURIComponent(parentPath);
      const response = await $fetch<FolderEntity>(
        `${this.basePath}/create-folder`,
        {
          method: 'POST',
          body: {
            parentPath,
            name,
          },
        }
      );
      return response;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async uploadFile(
    parentPath: string,
    file: Blob | ArrayBuffer | Uint8Array,
    name: string
  ): Promise<FileEntity> {
    try {
      // For file uploads, we need to use FormData
      const formData = new FormData();
      formData.append('parentPath', parentPath);
      formData.append('name', name);
      
      // Convert the file data to a Blob if it isn't already
      let blob: Blob;
      if (file instanceof Blob) {
        blob = file;
      } else if (file instanceof ArrayBuffer) {
        blob = new Blob([file as unknown as ArrayBuffer]);
      } else if (file instanceof Uint8Array) {
        blob = new Blob([file as unknown as ArrayBuffer]);
      } else {
        throw new Error('Unsupported file type for upload');
      }
      
      formData.append('file', blob, name);

      const response = await $fetch<FileEntity>(
        `${this.basePath}/upload`,
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - let browser set it with boundary
        }
      );
      return response;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async delete(path: string, permanent: boolean = false): Promise<FileOperationResult> {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await $fetch<FileOperationResult>(
        `${this.basePath}/${encodedPath}`,
        {
          method: 'DELETE',
          params: { permanent },
        }
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async rename(path: string, newName: string): Promise<FileSystemItem> {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await $fetch<FileSystemItem>(
        `${this.basePath}/${encodedPath}/rename`,
        {
          method: 'PATCH',
          body: { newName },
        }
      );
      return response;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async copy(
    sourcePath: string,
    options: TransferOptions
  ): Promise<FileOperationResult> {
    try {
      const encodedSource = encodeURIComponent(sourcePath);
      const encodedDest = encodeURIComponent(options.destinationPath);
      
      const response = await $fetch<FileOperationResult>(
        `${this.basePath}/${encodedSource}/copy`,
        {
          method: 'POST',
          body: {
            destinationPath: options.destinationPath,
            newName: options.newName,
            overwrite: options.overwrite,
          },
        }
      );
      return response;
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
    try {
      const encodedSource = encodeURIComponent(sourcePath);
      
      const response = await $fetch<FileOperationResult>(
        `${this.basePath}/${encodedSource}/move`,
        {
          method: 'POST',
          body: {
            destinationPath: options.destinationPath,
            newName: options.newName,
            overwrite: options.overwrite,
          },
        }
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async search(options: SearchOptions): Promise<FileSystemItem[]> {
    try {
      const response = await $fetch<FileSystemItem[]>(
        `${this.basePath}/search`,
        {
          method: 'GET',
          params: {
            query: options.query,
            path: options.path,
            recursive: options.recursive,
            type: options.type,
          },
        }
      );
      return response;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getDownloadUrl(path: string): Promise<string> {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await $fetch<string>(
        `${this.basePath}/${encodedPath}/download-url`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async getPreviewUrl(path: string): Promise<string | null> {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await $fetch<string | null>(
        `${this.basePath}/${encodedPath}/preview-url`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      // If error, return null (no preview available)
      return null;
    }
  }

  async getContent(path: string): Promise<string> {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await $fetch<string>(
        `${this.basePath}/${encodedPath}/content`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const item = await this.getByPath(path);
      return item !== null;
    } catch (error) {
      // If we get a 404 or similar, the item doesn't exist
      return false;
    }
  }
}

/**
 * Factory function for creating API repositories
 * Useful for dependency injection and testing
 */
export function createApiRepository(basePath?: string): FileRepository {
  return new ApiFileRepository(basePath);
}
