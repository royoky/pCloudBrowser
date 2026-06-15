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
  PCloudCopyFileResponse,
  PCloudCopyFolderResponse,
  PCloudCreateFolderResponse,
  PCloudDeleteFileResponse,
  PCloudDeleteFolderRecursiveResponse,
  PCloudFileLinkResponse,
  PCloudListFolderResponse,
  PCloudMediaTranscodeLinkResponse,
  PCloudRenameFileResponse,
  PCloudRenameFolderResponse,
  PCloudThumbLinkResponse,
  PCloudThumbsLinksResponse,
  PCloudUploadResponse,
} from '~~/server/models/pcloud-api'

import { $fetch } from 'ofetch'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import { getPCloudErrorMessage, isPCloudSuccess } from '~~/server/models/pcloud-api'

/**
 * Configuration for the pCloud client
 */
export interface PCloudClientConfig {
  /** Base hostname for pCloud API (e.g., 'api.pcloud.com') */
  hostname: string

  /** Authentication token for pCloud API */
  accessToken: string

  /** Optional timeout in milliseconds (default: 10000) */
  timeout?: number
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
    public readonly pCloudError?: string,
  ) {
    super(message)
    this.name = 'PCloudApiError'
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
  private readonly baseUrl: string
  private readonly accessToken: string
  private readonly timeout: number

  constructor(config: PCloudClientConfig) {
    this.baseUrl = `https://${config.hostname}`
    this.accessToken = config.accessToken
    this.timeout = config.timeout ?? 10000
  }

  /**
   * Gets the default headers for pCloud API requests
   */
  private get headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  /** Wraps $fetch with console logging for every pCloud API call. */
  private async call<T extends PCloudBaseResponse>(
    endpoint: string,
    params: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const start = Date.now()
    const response = await $fetch<T>(url, {
      method: 'GET',
      headers: this.headers,
      params,
      timeout: this.timeout,
    })
    console.info(`[pCloud] ${endpoint} ${response.result} ${Date.now() - start}ms`)
    return response
  }

  /**
   * Helper method to handle pCloud API responses
   * Throws PCloudApiError for unsuccessful responses
   */
  private async handleResponse<T extends PCloudBaseResponse>(response: T): Promise<T> {
    if (!isPCloudSuccess(response)) {
      const message
        = getPCloudErrorMessage(response) || `pCloud API returned error code: ${response.result}`

      // Map pCloud result codes to HTTP-like status codes
      const statusCode = this.mapResultToStatusCode(response.result)

      throw new PCloudApiError(message, statusCode, response.result, response.error)
    }

    return response
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
    }

    return codeMap[result] ?? 500 // Default to internal server error
  }

  async listFolder(folderId: string | number): Promise<PCloudListFolderResponse> {
    return this.handleResponse(
      await this.call<PCloudListFolderResponse>(PCLOUD_API_ENDPOINTS.FILES.LIST, {
        folderid: folderId,
      }),
    )
  }

  async createFolder(parentId: string | number, name: string): Promise<PCloudCreateFolderResponse> {
    return this.handleResponse(
      await this.call<PCloudCreateFolderResponse>(PCLOUD_API_ENDPOINTS.FILES.CREATE_FOLDER, {
        folderid: parentId,
        name,
      }),
    )
  }

  async renameFolder(
    folderId: string | number,
    newName: string,
  ): Promise<PCloudRenameFolderResponse> {
    return this.handleResponse(
      await this.call<PCloudRenameFolderResponse>(PCLOUD_API_ENDPOINTS.FILES.MOVE_FOLDER, {
        folderid: folderId,
        toname: newName,
      }),
    )
  }

  async moveFolder(
    folderId: string | number,
    toFolderId: string | number,
    newName?: string,
  ): Promise<PCloudRenameFolderResponse> {
    const params: Record<string, unknown> = { folderid: folderId, tofolderid: toFolderId }
    if (newName)
      params.toname = newName
    return this.handleResponse(
      await this.call<PCloudRenameFolderResponse>(PCLOUD_API_ENDPOINTS.FILES.MOVE_FOLDER, params),
    )
  }

  async deleteFolder(folderId: string | number): Promise<PCloudDeleteFolderRecursiveResponse> {
    return this.handleResponse(
      await this.call<PCloudDeleteFolderRecursiveResponse>(
        PCLOUD_API_ENDPOINTS.FILES.DELETE_FOLDER,
        { folderid: folderId },
      ),
    )
  }

  async copyFile(
    fileId: string | number,
    toFolderId: string | number,
    newName?: string,
  ): Promise<PCloudCopyFileResponse> {
    const params: Record<string, unknown> = { fileid: fileId, tofolderid: toFolderId }
    if (newName)
      params.toname = newName
    return this.handleResponse(
      await this.call<PCloudCopyFileResponse>(PCLOUD_API_ENDPOINTS.FILES.COPY_FILE, params),
    )
  }

  async copyFolder(
    folderId: string | number,
    toFolderId: string | number,
    newName?: string,
  ): Promise<PCloudCopyFolderResponse> {
    const params: Record<string, unknown> = { folderid: folderId, tofolderid: toFolderId }
    if (newName)
      params.toname = newName
    return this.handleResponse(
      await this.call<PCloudCopyFolderResponse>(PCLOUD_API_ENDPOINTS.FILES.COPY_FOLDER, params),
    )
  }

  async renameFile(fileId: string | number, newName: string): Promise<PCloudRenameFileResponse> {
    return this.handleResponse(
      await this.call<PCloudRenameFileResponse>(PCLOUD_API_ENDPOINTS.FILES.MOVE_FILE, {
        fileid: fileId,
        toname: newName,
      }),
    )
  }

  async moveFile(
    fileId: string | number,
    toFolderId: string | number,
    newName?: string,
  ): Promise<PCloudRenameFileResponse> {
    const params: Record<string, unknown> = { fileid: fileId, tofolderid: toFolderId }
    if (newName)
      params.toname = newName
    return this.handleResponse(
      await this.call<PCloudRenameFileResponse>(PCLOUD_API_ENDPOINTS.FILES.MOVE_FILE, params),
    )
  }

  async deleteFile(fileId: string | number): Promise<PCloudDeleteFileResponse> {
    return this.handleResponse(
      await this.call<PCloudDeleteFileResponse>(PCLOUD_API_ENDPOINTS.FILES.DELETE_FILE, {
        fileid: fileId,
      }),
    )
  }

  async getFileLink(fileId: string | number): Promise<PCloudFileLinkResponse> {
    return this.handleResponse(
      await this.call<PCloudFileLinkResponse>(PCLOUD_API_ENDPOINTS.FILES.DOWNLOAD, {
        fileid: fileId,
      }),
    )
  }

  /**
   * Uploads a file to pCloud.
   *
   * Sends the file as the raw request body (PUT /uploadfile?folderid=&filename=),
   * the same mechanism rclone uses. This avoids building a multipart FormData +
   * Blob on the server (an extra full-size copy of the file), keeping memory
   * pressure ~1x the file size instead of ~3-4x — which is what OOMed the
   * Cloudflare Worker isolate (128 MB) around 80 MB.
   */
  async uploadFile(
    folderId: string | number,
    name: string,
    mimeType: string,
    fileData: Uint8Array,
  ): Promise<PCloudUploadResponse> {
    const params = new URLSearchParams({
      folderid: folderId.toString(),
      filename: name,
      nopartial: '1',
    })
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.UPLOAD}?${params}`

    const start = Date.now()
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': mimeType || 'application/octet-stream',
      },
      // Uint8Array is a valid fetch body at runtime; the cast only sidesteps
      // TS 5.7's Uint8Array<ArrayBufferLike> vs BufferSource generic mismatch.
      body: fileData as BodyInit,
    })

    if (!response.ok) {
      throw new Error(`pCloud upload HTTP error: ${response.status} ${response.statusText}`)
    }

    const json = (await response.json()) as PCloudUploadResponse
    console.info(
      `[pCloud] PUT ${PCLOUD_API_ENDPOINTS.FILES.UPLOAD} ${json.result} ${Date.now() - start}ms`,
    )
    return this.handleResponse(json)
  }

  /** Returns a CDN link for a file thumbnail (same shape as getFileLink). */
  async getThumbLink(
    fileId: string | number,
    size: string = '256x256',
  ): Promise<PCloudThumbLinkResponse> {
    return this.handleResponse(
      await this.call<PCloudThumbLinkResponse>(PCLOUD_API_ENDPOINTS.THUMBNAILS.GET_LINK, {
        fileid: fileId,
        size,
      }),
    )
  }

  /**
   * Batch-fetches CDN thumbnail links for multiple files in a single call.
   * pCloud connects to multiple storage servers simultaneously, making this
   * more efficient than sequential getThumbLink calls.
   */
  async getThumbsLinks(
    fileIds: string[],
    size: string = '256x256',
  ): Promise<PCloudThumbsLinksResponse['thumbs']> {
    const response = await this.call<PCloudThumbsLinksResponse>(
      PCLOUD_API_ENDPOINTS.THUMBNAILS.GET_LINKS,
      { fileids: fileIds.join(','), size },
    )
    await this.handleResponse(response)
    return response.thumbs.filter(t => t.result === 0 && t.hosts?.length && t.path)
  }

  async getMetadata(path: string): Promise<PCloudListFolderResponse> {
    return this.handleResponse(
      await this.call<PCloudListFolderResponse>(PCLOUD_API_ENDPOINTS.FILES.GET, { path }),
    )
  }

  /**
   * Returns HLS and original variants for a video file.
   * Uses pCloud's undocumented getmediatranscodelink endpoint,
   * which is what pCloud's own web app uses for video playback.
   */
  async getMediaTranscodeLink(path: string): Promise<PCloudMediaTranscodeLinkResponse> {
    return this.handleResponse(
      await this.call<PCloudMediaTranscodeLinkResponse>(
        PCLOUD_API_ENDPOINTS.STREAMING.TRANSCODE_LINK,
        { path, transcodeahead: 1, mediatype: 'video' },
      ),
    )
  }
}
