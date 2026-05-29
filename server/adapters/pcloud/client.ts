/**
 * pCloud API Client
 * 
 * This is the low-level HTTP client for pCloud API.
 * It handles the technical details of communicating with pCloud's API.
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Only handles HTTP communication
 * - Separation of Concerns: Doesn't know about domain models
 * - Dependency Injection: Receives configuration, doesn't create it
 * - Error Handling: Consistent error handling approach
 */

import type {
  PCloudBaseResponse,
  PCloudListFolderResponse,
  PCloudCreateFolderResponse,
  PCloudRenameFolderResponse,
  PCloudDeleteFolderRecursiveResponse,
  PCloudCopyFileResponse,
  PCloudCopyFolderResponse,
  PCloudDeleteFileResponse,
  PCloudRenameFileResponse,
  PCloudFileLinkResponse,
} from '../../models/pcloud-api';

import { PCLOUD_API_ENDPOINTS } from '../../constants/pcloud-endpoints';
import { isPCloudSuccess, getPCloudErrorMessage } from '../../models/pcloud-api';

/**
 * Configuration for the pCloud client
 */
export interface PCloudClientConfig {
  /** Base hostname for pCloud API (e.g., 'api.pcloud.com') */
  hostname: string;
  
  /** Authentication token for pCloud API */
  accessToken: string;
  
  /** Optional timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Custom error class for pCloud API errors
 * Makes error handling more explicit and type-safe
 */
export class PCloudApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly pCloudResult: number,
    public readonly pCloudError?: string
  ) {
    super(message);
    this.name = 'PCloudApiError';
  }
}

/**
 * pCloud API Client
 * 
 * Low-level HTTP client for pCloud API operations.
 * This class does NOT deal with domain models - it only handles
 * the raw pCloud API responses.
 */
export class PCloudClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly timeout: number;

  constructor(config: PCloudClientConfig) {
    this.baseUrl = `https://${config.hostname}`;
    this.accessToken = config.accessToken;
    this.timeout = config.timeout ?? 10000;
  }

  /**
   * Gets the default headers for pCloud API requests
   */
  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Helper method to handle pCloud API responses
   * Throws PCloudApiError for unsuccessful responses
   */
  private async handleResponse<T extends PCloudBaseResponse>(
    response: T
  ): Promise<T> {
    if (!isPCloudSuccess(response)) {
      const message = getPCloudErrorMessage(response) 
        || `pCloud API returned error code: ${response.result}`;
      
      // Map pCloud result codes to HTTP-like status codes
      const statusCode = this.mapResultToStatusCode(response.result);
      
      throw new PCloudApiError(
        message,
        statusCode,
        response.result,
        response.error
      );
    }
    
    return response;
  }

  /**
   * Maps pCloud result codes to HTTP-like status codes
   * This helps with error handling consistency
   */
  private mapResultToStatusCode(result: number): number {
    const codeMap: Record<number, number> = {
      // Authentication errors
      1000: 401, // Wrong username/password
      2000: 401, // Wrong auth token
      
      // Access errors
      2001: 400, // Invalid parameters
      2003: 403, // Access denied
      
      // Resource errors
      2004: 409, // File/Folder already exists
      2005: 404, // Directory does not exist
      2006: 404, // File does not exist
      2007: 404, // Parent folder does not exist
      
      // Quota errors
      2008: 402, // Quota exceeded
      
      // Rate limiting
      2041: 429, // Too many requests
      
      // Server errors
      4000: 503, // Service unavailable
    };
    
    return codeMap[result] ?? 500; // Default to internal server error
  }

  /**
   * Lists the contents of a folder
   */
  async listFolder(folderId: string | number): Promise<PCloudListFolderResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.LIST}`;
    
    const response = await $fetch<PCloudListFolderResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params: { folderid: folderId },
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Creates a new folder
   */
  async createFolder(parentId: string | number, name: string): Promise<PCloudCreateFolderResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.CREATE_FOLDER}`;
    
    const response = await $fetch<PCloudCreateFolderResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params: {
        folderid: parentId,
        name,
      },
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Renames a folder
   */
  async renameFolder(
    folderId: string | number,
    newName: string
  ): Promise<PCloudRenameFolderResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.MOVE_FOLDER}`;
    
    const response = await $fetch<PCloudRenameFolderResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params: {
        folderid: folderId,
        toname: newName,
      },
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Moves a folder to a new location
   */
  async moveFolder(
    folderId: string | number,
    toFolderId: string | number,
    newName?: string
  ): Promise<PCloudRenameFolderResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.MOVE_FOLDER}`;
    
    const params: Record<string, string | number> = {
      folderid: folderId,
      tofolderid: toFolderId,
    };
    
    if (newName) {
      params.toname = newName;
    }

    const response = await $fetch<PCloudRenameFolderResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params,
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Deletes a folder recursively
   */
  async deleteFolder(folderId: string | number): Promise<PCloudDeleteFolderRecursiveResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DELETE_FOLDER}`;
    
    const response = await $fetch<PCloudDeleteFolderRecursiveResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params: { folderid: folderId },
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Copies a file
   */
  async copyFile(
    fileId: string | number,
    toFolderId: string | number,
    newName?: string
  ): Promise<PCloudCopyFileResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.COPY_FILE}`;
    
    const params: Record<string, string | number> = {
      fileid: fileId,
      tofolderid: toFolderId,
    };
    
    if (newName) {
      params.toname = newName;
    }

    const response = await $fetch<PCloudCopyFileResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params,
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Copies a folder
   */
  async copyFolder(
    folderId: string | number,
    toFolderId: string | number,
    newName?: string
  ): Promise<PCloudCopyFolderResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.COPY_FOLDER}`;
    
    const params: Record<string, string | number> = {
      folderid: folderId,
      tofolderid: toFolderId,
    };
    
    if (newName) {
      params.toname = newName;
    }

    const response = await $fetch<PCloudCopyFolderResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params,
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Renames a file
   */
  async renameFile(
    fileId: string | number,
    newName: string
  ): Promise<PCloudRenameFileResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.MOVE_FILE}`;
    
    const response = await $fetch<PCloudRenameFileResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params: {
        fileid: fileId,
        toname: newName,
      },
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Moves a file to a new location
   */
  async moveFile(
    fileId: string | number,
    toFolderId: string | number,
    newName?: string
  ): Promise<PCloudRenameFileResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.MOVE_FILE}`;
    
    const params: Record<string, string | number> = {
      fileid: fileId,
      tofolderid: toFolderId,
    };
    
    if (newName) {
      params.toname = newName;
    }

    const response = await $fetch<PCloudRenameFileResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params,
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Deletes a file
   */
  async deleteFile(fileId: string | number): Promise<PCloudDeleteFileResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DELETE_FILE}`;
    
    const response = await $fetch<PCloudDeleteFileResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params: { fileid: fileId },
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Gets a download link for a file
   */
  async getFileLink(fileId: string | number): Promise<PCloudFileLinkResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.DOWNLOAD}`;
    
    const response = await $fetch<PCloudFileLinkResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params: { fileid: fileId },
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }

  /**
   * Gets metadata for a file or folder
   */
  async getMetadata(path: string): Promise<PCloudListFolderResponse> {
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.GET}`;
    
    const response = await $fetch<PCloudListFolderResponse>(url, {
      method: 'GET',
      headers: this.headers,
      params: { path },
      timeout: this.timeout,
    });

    return this.handleResponse(response);
  }
}
