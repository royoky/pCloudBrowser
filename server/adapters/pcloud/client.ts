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
  PCloudUploadCreateResponse,
  PCloudUploadSaveResponse,
} from '~~/server/models/pcloud-api'

import { $fetch } from 'ofetch'

import { PCLOUD_API_ENDPOINTS } from '~~/server/constants/pcloud-endpoints'
import {
  getPCloudErrorMessage,
  isPCloudSuccess,
  PCloudResultCode,
} from '~~/server/models/pcloud-api'

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
    // Fetch returns unknown to ensure type safety at the boundary
    const response = await $fetch<unknown>(url, {
      method: 'GET',
      headers: this.headers,
      params,
      timeout: this.timeout,
    })
    const validated = await this.handleResponse<T>(response)
    console.info(`[pCloud] ${endpoint} ${validated.result} ${Date.now() - start}ms`)
    return validated
  }

  /**
   * Type guard to validate pCloud base response structure
   */
  private isPCloudBaseResponse(data: unknown): data is PCloudBaseResponse {
    return typeof data === 'object'
      && data !== null
      && 'result' in data
      && typeof (data as PCloudBaseResponse).result === 'number'
  }

  /**
   * Helper method to handle pCloud API responses
   * Throws PCloudApiError for unsuccessful responses
   * Accepts unknown and validates it as PCloudBaseResponse
   */
  private async handleResponse<T extends PCloudBaseResponse>(response: unknown): Promise<T> {
    // Validate that the response is a PCloudBaseResponse
    if (!this.isPCloudBaseResponse(response)) {
      throw new Error(`Invalid pCloud API response: ${JSON.stringify(response)}`)
    }

    if (!isPCloudSuccess(response)) {
      const message
        = getPCloudErrorMessage(response) || `pCloud API returned error code: ${response.result}`

      // Map pCloud result codes to HTTP-like status codes
      const statusCode = this.mapResultToStatusCode(response.result)

      throw new PCloudApiError(message, statusCode, response.result, response.error)
    }

    return response as T
  }

  /**
   * Maps pCloud result codes to HTTP-like status codes
   * This helps with error handling consistency.
   * Uses exhaustiveness check to catch unhandled result codes.
   */
  private mapResultToStatusCode(result: number): number {
    // Map known pCloud result codes to HTTP status codes
    // Uses a switch for exhaustiveness checking
    switch (result) {
      // Success
      case PCloudResultCode.SUCCESS:
        return 200

      // Authentication errors
      case PCloudResultCode.AUTHORIZATION_ERROR:
        return 401

      // Resource errors
      case PCloudResultCode.ALREADY_EXISTS:
        return 409
      case PCloudResultCode.NOT_FOUND:
      case PCloudResultCode.SHARE_NOT_FOUND:
        return 404

      // Access errors
      case PCloudResultCode.INVALID_PARAMS:
        return 400
      case PCloudResultCode.RATE_LIMIT:
      case PCloudResultCode.SHARE_PERMISSION_DENIED:
        return 403

      // Quota errors
      case PCloudResultCode.FILE_TOO_LARGE:
      case PCloudResultCode.STORAGE_QUOTA_EXCEEDED:
        return 402

      // Server errors
      case PCloudResultCode.MAINTENANCE:
        return 503

      // Generic error
      case PCloudResultCode.ERROR:
      case PCloudResultCode.PARTIAL_ERROR:
        return 400

      // If a new PCloudResultCode is added but not handled here,
      // this will cause a compile-time error due to the exhaustiveness check
      default:
        // For truly unknown codes (e.g., from future pCloud API changes),
        // throw an error rather than silently defaulting
        throw new Error(`Unhandled pCloud result code: ${result}`)
    }
  }

  /**
   * Lists a folder by id. With `recursive`, pCloud returns the whole subtree in
   * one response (children nested under each folder's `contents`); note that in
   * recursive mode nested items carry no `path`, only `name` + `parentfolderid`.
   */
  async listFolder(
    folderId: string | number,
    recursive: boolean = false,
  ): Promise<PCloudListFolderResponse> {
    const params: Record<string, unknown> = { folderid: folderId }
    if (recursive)
      params.recursive = 1
    return this.handleResponse(
      await this.call<PCloudListFolderResponse>(PCLOUD_API_ENDPOINTS.FILES.LIST, params),
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
   * Opens a resumable upload session. Returns a numeric uploadid that is
   * persistent — it can be referenced across separate, independent HTTP
   * requests (unlike fileops file descriptors), which is what makes chunked
   * upload work on stateless serverless runtimes.
   */
  async uploadCreate(): Promise<number> {
    const res = await this.call<PCloudUploadCreateResponse>(
      PCLOUD_API_ENDPOINTS.FILES.UPLOAD_CREATE,
      {},
    )
    return res.uploadid
  }

  /**
   * Writes a chunk to an upload session at a byte offset. The chunk is the raw
   * request body (PUT), so no multipart framing and no extra in-memory copy.
   */
  async uploadWrite(
    uploadId: number | string,
    offset: number,
    data: Uint8Array,
  ): Promise<void> {
    const params = new URLSearchParams({
      uploadid: uploadId.toString(),
      uploadoffset: offset.toString(),
    })
    const url = `${this.baseUrl}${PCLOUD_API_ENDPOINTS.FILES.UPLOAD_WRITE}?${params}`

    // Uint8Array is a valid BodyInit at runtime. The cast is needed due to
    // TypeScript 5.7's change in Uint8Array generic parameter from BufferSource to ArrayBufferLike.
    // This is safe because Uint8Array implements BufferSource.
    const response = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: data as BodyInit,
    })

    if (!response.ok) {
      throw new Error(`pCloud upload_write HTTP error: ${response.status} ${response.statusText}`)
    }
    // Validate and handle the response
    const json = await response.json()
    await this.handleResponse(json)
  }

  /** Finalizes an upload session into a real file in the target folder. */
  async uploadSave(
    uploadId: number | string,
    folderId: number | string,
    name: string,
  ): Promise<PCloudUploadSaveResponse> {
    return this.handleResponse(
      await this.call<PCloudUploadSaveResponse>(PCLOUD_API_ENDPOINTS.FILES.UPLOAD_SAVE, {
        uploadid: uploadId,
        folderid: folderId,
        name,
      }),
    )
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
