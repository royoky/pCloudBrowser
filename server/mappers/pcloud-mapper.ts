import type { User } from '#auth-utils'
import type {
  PCloudFile,
  PCloudFileMetadata,
  PCloudFolder,
  PCloudFolderMetadata,
  PCloudListResponse,
  PCloudUserInfo,
} from '~~/server/models/pcloud-api'

import type {
  CloudFile,
  CloudFolder,
  CloudItem,
  CloudItemCapabilities,
  MiniCloudFolder,
} from '../../shared/models/cloud-item'

/**
 * pCloud to Cloud Item Mapper
 *
 * Converts pCloud-specific API responses to provider-agnostic CloudItem models
 */
import { getFileCategory } from '../../shared/utils/file-categories'

export function mapPCloudItemToCloudItem(
  item: PCloudFileMetadata | PCloudFolderMetadata,
  currentPath: string = '/',
): CloudItem {
  const itemId = item.isfolder ? item.folderid.toString() : item.fileid.toString()

  const itemPath
    = item.path || (currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`)

  const baseItem = {
    id: itemId,
    name: item.name,
    path: itemPath,
    parentId: item.parentfolderid?.toString(),
    createdAt: item.created,
    modifiedAt: item.modified,
    capabilities: {
      canPreview: false,
      canEdit: false,
      canDownload: true,
      canShare: true,
      canDelete: true,
    },
  }

  if (item.isfolder) {
    return {
      ...baseItem,
      type: 'folder',
      itemCount: item.contents?.length ?? 0,
      entries: item.contents ? mapPCloudItems(item.contents, currentPath) : [],
    }
  }

  const extension = item.name.split('.').pop() || ''
  const category = getFileCategory(extension)

  return {
    ...baseItem,
    type: 'file',
    extension,
    mimeType: item.contenttype,
    size: item.size,
    category: category.name,
    capabilities: {
      ...baseItem.capabilities,
      canPreview: category.previewable,
      canEdit: category.editable,
    },
  }
}

export function mapPCloudItems(
  items: (PCloudFile | PCloudFolder)[],
  currentPath: string = '/',
): CloudItem[] {
  return items.map(item => mapPCloudItemToCloudItem(item, currentPath))
}

export function mapPCloudListToCloudFolder(
  listResponse: PCloudListResponse,
  currentPath: string = '/',
): CloudFolder {
  const cloudItems = mapPCloudItems(listResponse.metadata.contents, currentPath)

  // Use the folder's own path from pCloud, or fall back to currentPath
  const folderPath = listResponse.metadata.path || currentPath

  return {
    id: listResponse.metadata.folderid.toString(),
    name: listResponse.metadata.name,
    type: 'folder',
    path: folderPath,
    parentId: listResponse.metadata.parentfolderid?.toString() ?? null,
    createdAt: listResponse.metadata.created,
    modifiedAt: listResponse.metadata.modified,
    itemCount: listResponse.metadata.contents.length,
    entries: cloudItems,
    capabilities: {
      canPreview: false,
      canEdit: false,
      canDownload: false,
      canShare: true,
      canDelete: true,
    },
  }
}

export function mapPCloudFolderToCloudFolder(
  metadata: PCloudFolderMetadata,
  fallbackPath: string = '',
): MiniCloudFolder {
  // pCloud represents the root folder with parent ID 0.
  // We map this to our explicit `null` for root items.
  const parentId = metadata.parentfolderid === 0 ? null : metadata.parentfolderid.toString()

  // pCloud includes `path` in create/rename responses, but sometimes omits it elsewhere.
  // We use the fallback if it's missing.
  const path = metadata.path || fallbackPath || `/${metadata.name}`

  // Convert pCloud's HTTP-date format (e.g., "Wed, 02 Oct 2013 13:11:53 +0000")
  // to a standard frontend-friendly ISO 8601 string.
  const createdAt = new Date(metadata.created).toISOString()
  const modifiedAt = new Date(metadata.modified).toISOString()

  // Base capabilities derived from pCloud's metadata flags
  const capabilities: CloudItemCapabilities = {
    canPreview: false, // It's a folder, not a file
    canEdit: metadata.ismine, // Assuming ownership grants edit rights
    canDownload: true, // You can usually download folders as ZIPs via the API
    canShare: !metadata.isshared && metadata.ismine,
    canDelete: metadata.ismine,
  }

  return {
    id: metadata.folderid.toString(), // Standardize IDs as strings
    name: metadata.name,
    type: 'folder',
    path,
    parentId,
    createdAt,
    modifiedAt,
    capabilities,
    itemCount: 0,
  }
}

/**
 * Maps pCloud user info to cloud-agnostic user format
 */
export function mapPCloudUserToCloudUser(pcloudUser: PCloudUserInfo): User {
  return {
    pcloudId: pcloudUser.uid,
    email: pcloudUser.email,
    emailVerified: pcloudUser.emailverified,
    registered: pcloudUser.registered,
    premium: pcloudUser.premium,
    premiumexpires: pcloudUser.premiumexpires,
    quota: pcloudUser.quota,
    usedquota: pcloudUser.usedquota,
    language: pcloudUser.language,
  }
}

/**
 * Maps pCloud's integer category to our agnostic FileCategory string
 * pCloud categories: 0: uncategorized, 1: image, 2: video, 3: audio, 4: document, 5: archive
 */
function mapPCloudCategory(categoryId: number, mimeType: string): FileCategory {
  switch (categoryId) {
    case 1:
      return 'image'
    case 2:
      return 'video'
    case 3:
      return 'audio'
    case 4:
      return 'document'
    case 5:
      return 'archive'
    default:
      if (
        mimeType.includes('text/')
        || mimeType.includes('application/json')
        || mimeType.includes('javascript')
      ) {
        return 'code'
      }
      return 'unknown'
  }
}

/**
 * Extracts the file extension from the filename
 */
function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex <= 0)
    return ''
  return filename.substring(lastDotIndex + 1).toLowerCase()
}

/**
 * Maps a single pCloud file metadata object to the agnostic CloudFile format
 */
export function mapPCloudFileToCloudFile(
  metadata: PCloudFileMetadata,
  fallbackPath: string = '',
): CloudFile {
  const parentId = metadata.parentfolderid === 0 ? null : metadata.parentfolderid.toString()
  const path = metadata.path || fallbackPath || `/${metadata.name}`

  const createdAt = new Date(metadata.created).toISOString()
  const modifiedAt = new Date(metadata.modified).toISOString()

  // Determine capabilities
  const capabilities: CloudItemCapabilities = {
    // pCloud generates thumbs for images/videos. If thumbready is true, we can preview it.
    canPreview: metadata.thumbready === true || [1, 2, 3].includes(metadata.category),
    canEdit: metadata.ismine, // Assuming ownership grants edit rights
    canDownload: true,
    canShare: !metadata.isshared && metadata.ismine,
    canDelete: metadata.ismine,
  }

  return {
    id: metadata.fileid.toString(),
    name: metadata.name,
    type: 'file',
    path,
    parentId,
    createdAt,
    modifiedAt,
    capabilities,

    // File-specific properties
    extension: getFileExtension(metadata.name),
    mimeType: metadata.contenttype,
    size: metadata.size,
    category: mapPCloudCategory(metadata.category, metadata.contenttype),
  }
}
