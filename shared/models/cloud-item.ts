/**
 * Cloud Storage - Provider Agnostic Models
 *
 * These models define the common interface for cloud storage items
 * that works across multiple cloud providers (pCloud, Google Drive, etc.)
 */

export type CloudItemType = 'file' | 'folder'

export interface CloudItemCapabilities {
  canPreview: boolean
  canEdit: boolean
  canDownload: boolean
  canShare: boolean
  canDelete: boolean
}

export interface BaseCloudItem<T extends CloudItemType> {
  id: string
  name: string
  type: T
  path: string
  parentId: string | null
  createdAt: string
  modifiedAt: string
  capabilities: CloudItemCapabilities
}

export interface CloudFolder extends BaseCloudItem<'folder'> {
  itemCount: number
  entries: EntryItem[] // Nested items (first level only)
}

export interface MiniCloudFolder extends Omit<CloudFolder, 'entries'> {}

export interface CloudFile extends BaseCloudItem<'file'> {
  extension: string
  mimeType: string
  size: number
  category: FileCategory
}

export type CloudItem = CloudFile | CloudFolder
export type EntryItem = CloudFile | MiniCloudFolder

export interface CloudFileLink {
  downloadUrl: string
  expires: string
}
