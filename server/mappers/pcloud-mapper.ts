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

  const baseItem = {
    id: itemId,
    name: item.name,
    path: currentPath,
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
      itemCount: 0, // Individual items don't have filecount, only folder listings do
      // Note: entries would be populated separately if needed
    } as CloudFolder
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
  } as CloudFile
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

  return {
    id: listResponse.metadata.folderid.toString(),
    name: listResponse.metadata.name,
    type: 'folder',
    path: currentPath,
    parentId: listResponse.metadata.parentfolderid?.toString() ?? null,
    createdAt: listResponse.metadata.created,
    modifiedAt: listResponse.metadata.modified,
    itemCount: listResponse.metadata.filecount ?? 0,
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
