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
  PCloudFileMetadata,
  PCloudFolderContents,
  PCloudFolderMetadata,
  PCloudItemMetadata,
} from '~~/server/models/pcloud-api'

import type {
  FileEntity,
  FileOperationResult,
  FileRepository,
  FileSystemItem,
  FolderEntity,
  ListOptions,
  SearchOptions,
  TransferOptions,
} from '~~/shared/domain/ports/file.repository'
import { PCloudApiError, PCloudClient } from '~~/server/adapters/pcloud/client'

import { FileSystemPath, isFile, isFolder } from '~~/shared/domain/models/file-system.entity'

export type { FileRepository }

/**
 * Configuration for the pCloud repository
 */
export interface PCloudRepositoryConfig {
  /** Base hostname for pCloud API */
  hostname: string

  /** Authentication token for pCloud API */
  accessToken: string

  /** Optional timeout in milliseconds */
  timeout?: number

  /** Root folder ID for pCloud (default: 0) */
  rootFolderId?: string | number
}

/**
 * Path to pCloud ID cache
 * This is a simple in-memory cache for path-to-ID lookups
 * In a production app, you might want a more sophisticated caching strategy
 */
class PathIdCache {
  private cache = new Map<string, string>()
  private reverseCache = new Map<string, string>()

  set(path: string, id: string): void {
    this.cache.set(path, id)
    this.reverseCache.set(id, path)
  }

  getId(path: string): string | undefined {
    return this.cache.get(path)
  }

  getPath(id: string): string | undefined {
    return this.reverseCache.get(id)
  }

  clear(): void {
    this.cache.clear()
    this.reverseCache.clear()
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
// Module-level cache for thumbnail CDN URLs so list() and subsequent preview
// requests (separate HTTP requests, separate repository instances) share state.
// Key: pCloud fileid string. TTL mirrors pCloud signed URL lifetime.
const thumbnailCdnCache = new Map<string, { url: string, expiresAt: number }>()
const THUMBNAIL_TTL_MS = 4 * 60 * 1000

export class PCloudFileRepository implements FileRepository {
  private readonly client: PCloudClient
  private readonly rootFolderId: string
  private readonly pathIdCache: PathIdCache

  constructor(config: PCloudRepositoryConfig) {
    this.client = new PCloudClient({
      hostname: config.hostname,
      accessToken: config.accessToken,
      timeout: config.timeout,
    })
    this.rootFolderId = (config.rootFolderId ?? 0).toString()
    this.pathIdCache = new PathIdCache()
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
    parentPath: string,
    thumbnailUrls: Map<string, string> = new Map(),
  ): FileEntity {
    const path = pcloudItem.path || FileSystemPath.join(parentPath, pcloudItem.name)
    const extension = pcloudItem.name.includes('.')
      ? pcloudItem.name.split('.').pop()!
      : ''
    const id = pcloudItem.fileid.toString()

    return {
      id,
      name: pcloudItem.name,
      path,
      type: 'file',
      createdAt: new Date(pcloudItem.created),
      modifiedAt: new Date(pcloudItem.modified),
      size: pcloudItem.size,
      mimeType: pcloudItem.contenttype,
      extension,
      hasThumbnail: thumbnailUrls.has(id),
    }
  }

  /**
   * Maps pCloud folder metadata to domain FolderEntity
   */
  private mapToFolderEntity(
    pcloudItem: PCloudFolderMetadata,
    parentPath: string,
    children: FileSystemItem[] = [],
  ): FolderEntity {
    const path = pcloudItem.path || FileSystemPath.join(parentPath, pcloudItem.name)

    return {
      id: pcloudItem.folderid.toString(),
      name: pcloudItem.name,
      path,
      type: 'folder',
      createdAt: new Date(pcloudItem.created),
      modifiedAt: new Date(pcloudItem.modified),
      itemCount: children.length,
      isLoaded: true,
      children,
    }
  }

  /**
   * Maps a pCloud item (file or folder) to a domain entity
   */
  private mapToEntity(
    pcloudItem: PCloudItemMetadata,
    parentPath: string,
    thumbnailUrls?: Map<string, string>,
  ): FileSystemItem {
    if (pcloudItem.isfolder) {
      return this.mapToFolderEntity(pcloudItem, parentPath, [])
    }
    return this.mapToFileEntity(pcloudItem, parentPath, thumbnailUrls)
  }

  /**
   * Converts a path to a pCloud folder/file ID
   * Uses cache when available, falls back to API lookup
   */
  private async pathToId(path: string): Promise<string> {
    // Check cache first
    const cachedId = this.pathIdCache.getId(path)
    if (cachedId) {
      return cachedId
    }

    // For root path, return root folder ID
    if (path === '/') {
      return this.rootFolderId
    }

    // Try to get ID from API
    try {
      const response = await this.client.getMetadata(path)
      const item = response.metadata

      // Use type-safe property access based on isfolder discriminator
      // Both PCloudFolderMetadata and PCloudFolderContents have folderid
      // PCloudFileMetadata has fileid
      let id: string
      if (item.isfolder) {
        // For folders, folderid is available (from PCloudFolderMetadata)
        id = (item as unknown as { folderid: number }).folderid.toString()
      }
      else {
        // For files, fileid is available (from PCloudFileMetadata)
        id = (item as unknown as { fileid: number }).fileid.toString()
      }

      // Cache the result
      this.pathIdCache.set(path, id)

      return id
    }
    catch (error) {
      // If we can't get the ID from path, we'll need to handle this differently
      // For now, we'll extract ID from path if it looks like a numeric ID
      if (/^\/\d+$/.test(path)) {
        return path.substring(1)
      }
      throw error
    }
  }

  /**
   * Converts a pCloud ID to a path
   * Uses cache when available
   */
  private idToPath(id: string): string {
    const cachedPath = this.pathIdCache.getPath(id)
    if (cachedPath) {
      return cachedPath
    }
    return `/${id}` // Fallback
  }

  // ========================================================================
  // FileRepository Implementation
  // ========================================================================

  async list(path: string, _options?: ListOptions): Promise<FolderEntity> {
    const folderId = await this.pathToId(path)
    const response = await this.client.listFolder(folderId)
    const pcloudFolder = response.metadata
    const folderPath = pcloudFolder.path || path

    this.pathIdCache.set(folderPath, pcloudFolder.folderid.toString())

    // Batch-fetch thumbnail URLs for image files in one round-trip.
    const thumbnailUrls = await this.fetchThumbnailUrls(pcloudFolder.contents ?? [])

    const children = (pcloudFolder.contents ?? []).map(item =>
      this.mapToEntity(item, folderPath, thumbnailUrls),
    )

    return this.mapToFolderEntity(pcloudFolder, FileSystemPath.getParent(folderPath), children)
  }

  /**
   * Calls getthumbslinks for all image files with a pCloud thumbnail,
   * returning a fileid → CDN URL map. Non-fatal: returns empty map on error.
   */
  private async fetchThumbnailUrls(
    items: PCloudItemMetadata[],
  ): Promise<Map<string, string>> {
    // Include images and videos regardless of thumbready: false just means the
    // thumbnail hasn't been pre-cached, not that it can't be generated.
    const imageFileIds = items
      .filter((item) => {
        if (item.isfolder)
          return false
        const mime = (item as PCloudFileMetadata).contenttype ?? ''
        return mime.startsWith('image/') || mime.startsWith('video/')
      })
      .map(item => (item as PCloudFileMetadata).fileid.toString())

    if (!imageFileIds.length)
      return new Map()

    try {
      const thumbs = await this.client.getThumbsLinks(imageFileIds)
      const result = new Map<string, string>()
      const expiresAt = Date.now() + THUMBNAIL_TTL_MS
      for (const t of thumbs) {
        const url = `https://${t.hosts![0]}${t.path}`
        const id = t.fileid.toString()
        result.set(id, url)
        thumbnailCdnCache.set(id, { url, expiresAt })
      }
      return result
    }
    catch {
      return new Map()
    }
  }

  async getById(id: string): Promise<FileSystemItem | null> {
    try {
      // Get the path from cache or use ID as path
      const path = this.idToPath(id)
      const item = await this.getByPath(path)
      return item
    }
    catch (error) {
      if (error instanceof PCloudApiError && error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  async getByPath(path: string): Promise<FileSystemItem | null> {
    try {
      // For root, we need special handling
      if (path === '/') {
        return this.list('/')
      }

      // Get metadata from pCloud
      const response = await this.client.getMetadata(path)
      const pcloudItem = response.metadata

      // Build parent path
      const parentPath = FileSystemPath.getParent(path)

      // Map to domain entity
      return this.mapToEntity(pcloudItem, parentPath)
    }
    catch (error) {
      if (error instanceof PCloudApiError && error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  async createFolder(parentPath: string, name: string): Promise<FolderEntity> {
    // Get parent folder ID
    const parentId = await this.pathToId(parentPath)

    // Create folder via pCloud API
    const response = await this.client.createFolder(parentId, name)
    const pcloudFolder = response.metadata

    // Map to domain entity
    return this.mapToFolderEntity(
      pcloudFolder,
      FileSystemPath.join(parentPath, name),
    )
  }

  async createUpload(): Promise<string> {
    const uploadId = await this.client.uploadCreate()
    return uploadId.toString()
  }

  async writeUploadChunk(uploadId: string, offset: number, data: Uint8Array): Promise<void> {
    await this.client.uploadWrite(uploadId, offset, data)
  }

  async saveUpload(uploadId: string, parentPath: string, name: string): Promise<FileEntity> {
    const folderId = await this.pathToId(parentPath)
    const response = await this.client.uploadSave(uploadId, folderId, name)
    return this.mapToFileEntity(response.metadata, parentPath)
  }

  async delete(path: string, _permanent: boolean = false): Promise<FileOperationResult> {
    try {
      const item = await this.getByPath(path)

      if (!item) {
        return {
          success: false,
          error: `Item not found: ${path}`,
        }
      }

      const id = isFile(item) ? await this.pathToId(path) : await this.pathToId(path)

      if (isFile(item)) {
        await this.client.deleteFile(id)
      }
      else {
        await this.client.deleteFolder(id)
      }

      // Clear cache for this path
      this.pathIdCache.clear()

      return {
        success: true,
        item,
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async rename(path: string, newName: string): Promise<FileSystemItem> {
    const item = await this.getByPath(path)

    if (!item) {
      throw new Error(`Item not found: ${path}`)
    }

    const parentPath = FileSystemPath.getParent(path)
    const _parentId = await this.pathToId(parentPath)
    const itemId = isFile(item) ? await this.pathToId(path) : await this.pathToId(path)

    if (isFile(item)) {
      const response = await this.client.renameFile(itemId, newName)
      const pcloudFile = response.metadata
      return this.mapToFileEntity(pcloudFile, parentPath)
    }
    else {
      const response = await this.client.renameFolder(itemId, newName)
      const pcloudFolder = response.metadata
      return this.mapToFolderEntity(pcloudFolder, parentPath, [])
    }
  }

  async copy(
    sourcePath: string,
    options: TransferOptions,
  ): Promise<FileOperationResult> {
    const sourceItem = await this.getByPath(sourcePath)

    if (!sourceItem) {
      return {
        success: false,
        error: `Source item not found: ${sourcePath}`,
      }
    }

    try {
      const sourceId = isFile(sourceItem)
        ? await this.pathToId(sourcePath)
        : await this.pathToId(sourcePath)
      const destinationId = await this.pathToId(options.destinationPath)

      if (isFile(sourceItem)) {
        await this.client.copyFile(
          sourceId,
          destinationId,
          options.newName,
        )
      }
      else {
        await this.client.copyFolder(
          sourceId,
          destinationId,
          options.newName,
        )
      }

      return {
        success: true,
        item: sourceItem,
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async move(
    sourcePath: string,
    options: TransferOptions,
  ): Promise<FileOperationResult> {
    const sourceItem = await this.getByPath(sourcePath)

    if (!sourceItem) {
      return {
        success: false,
        error: `Source item not found: ${sourcePath}`,
      }
    }

    try {
      const sourceId = isFile(sourceItem)
        ? await this.pathToId(sourcePath)
        : await this.pathToId(sourcePath)
      const destinationId = await this.pathToId(options.destinationPath)

      if (isFile(sourceItem)) {
        await this.client.moveFile(
          sourceId,
          destinationId,
          options.newName,
        )
      }
      else {
        await this.client.moveFolder(
          sourceId,
          destinationId,
          options.newName,
        )
      }

      // Clear cache since paths have changed
      this.pathIdCache.clear()

      return {
        success: true,
        item: sourceItem,
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async search(options: SearchOptions): Promise<FileSystemItem[]> {
    // Require 3+ characters before listing the whole tree (avoids huge result
    // sets, and matches the prior UX) — return nothing for shorter queries.
    if (options.query.trim().length < 3)
      return []

    // pCloud's `/search` is account-wide and ignores the OAuth app-folder scope,
    // leaking out-of-scope file names and capping results before we can filter.
    // Instead, list the app folder recursively (inherently in-scope) and filter
    // by name ourselves. Recursive listfolder returns no `path` on nested items,
    // so paths are built from `name`s during the flatten (and deleted items are
    // excluded by pCloud unless we ask for them).
    const response = await this.client.listFolder(this.rootFolderId, true)
    const all = this.flattenTree(response.metadata)

    const query = options.query.trim().toLowerCase()
    const scope = options.path ?? '/'
    const matches = all.filter(
      item =>
        item.name.toLowerCase().includes(query)
        && this.isWithinScope(item.path, scope, options.recursive ?? false),
    )

    if (options.type === 'file')
      return matches.filter(isFile)
    if (options.type === 'folder')
      return matches.filter(isFolder)
    return matches
  }

  /**
   * Flattens a recursive `/listfolder` tree into a flat list of entities with
   * absolute paths. Paths are accumulated during the descent (recursive
   * listfolder omits `path` on nested items), so no per-item lookup is needed.
   * Iterative (explicit stack) so a deep tree can't overflow the call stack.
   */
  private flattenTree(root: PCloudFolderContents): FileSystemItem[] {
    const items: FileSystemItem[] = []
    // Explicit stack (not recursion) so a deep tree can't overflow the call
    // stack. `pop()!` is sound here — the loop only runs while the stack is
    // non-empty (tsconfig has noUncheckedIndexedAccess, so pop() is T | undefined).
    const stack: Array<{ node: PCloudItemMetadata, parentPath: string }> = (
      root.contents ?? []
    ).map(node => ({ node, parentPath: '/' }))

    while (stack.length > 0) {
      const { node, parentPath } = stack.pop()!
      const entity = this.mapToEntity(node, parentPath)
      items.push(entity)

      if (node.isfolder) {
        for (const child of node.contents ?? [])
          stack.push({ node: child, parentPath: entity.path })
      }
    }

    return items
  }

  /**
   * True if `itemPath` belongs to a search rooted at `scope`. With `recursive`,
   * any descendant matches; otherwise only direct children of `scope`.
   */
  private isWithinScope(itemPath: string, scope: string, recursive: boolean): boolean {
    if (scope === '/')
      return recursive ? true : FileSystemPath.getParent(itemPath) === '/'

    if (recursive)
      return itemPath === scope || itemPath.startsWith(`${scope}/`)

    return FileSystemPath.getParent(itemPath) === scope
  }

  async getDownloadUrl(path: string): Promise<string> {
    const item = await this.getByPath(path)
    if (!item || !isFile(item))
      throw new Error(`File not found: ${path}`)

    // item.id is the pCloud fileid — no second /stat call needed.
    const response = await this.client.getFileLink(item.id)
    return `https://${response.hosts[0]}${response.path}`
  }

  async getPreviewUrl(path: string): Promise<string | null> {
    const item = await this.getByPath(path)
    if (!item || !isFile(item))
      return null

    const isImage = item.mimeType.startsWith('image/')
    const isPreviewable = isImage
      || item.mimeType.startsWith('video/')
      || item.mimeType.startsWith('audio/')
      || item.mimeType.startsWith('text/')
      || item.mimeType === 'application/pdf'

    if (!isPreviewable)
      return null

    // Images: serve a scaled thumbnail. Check the module-level cache first —
    // list() pre-populates it via getthumbslinks so most preview requests are
    // a cache hit and skip the extra getthumblink round-trip.
    if (isImage) {
      const cached = thumbnailCdnCache.get(item.id)
      if (cached && cached.expiresAt > Date.now())
        return cached.url

      const response = await this.client.getThumbLink(item.id, '1024x768')
      return `https://${response.hosts[0]}${response.path}`
    }

    const response = await this.client.getFileLink(item.id)
    return `https://${response.hosts[0]}${response.path}`
  }

  async getStreamUrl(path: string): Promise<string | null> {
    try {
      const response = await this.client.getMediaTranscodeLink(path)
      const hls = response.variants.find(v => v.transcodetype === 'hls')
      if (!hls)
        return null
      return `https://${hls.hosts[0]}${hls.path}`
    }
    catch {
      return null
    }
  }

  async getContent(path: string): Promise<string> {
    const url = await this.getDownloadUrl(path)

    // Fetch the content and return as text
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`)
    }

    return response.text()
  }

  async exists(path: string): Promise<boolean> {
    try {
      const item = await this.getByPath(path)
      return item !== null
    }
    catch (error) {
      if (error instanceof PCloudApiError && error.statusCode === 404) {
        return false
      }
      throw error
    }
  }
}

/**
 * Factory function for creating pCloud repositories
 * Useful for dependency injection
 */
export function createPCloudRepository(
  config: PCloudRepositoryConfig,
): FileRepository {
  return new PCloudFileRepository(config)
}
