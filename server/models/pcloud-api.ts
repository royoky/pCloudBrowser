/**
 * pCloud API Base Model - Server Side
 * Based on pCloud HTTP JSON Protocol
 */

import { PCloudResultCode } from '../constants/pcloud-result-codes'

// 1. Base Response Shape
// pCloud always returns a 'result' number. If it's not 0, it includes an 'error' string.
export interface PCloudBaseResponse {
  result: number
  error?: string
}

// 2. Metadata Structures (Discriminated Union)
export interface PCloudBaseMetadata {
  name: string
  created: string // e.g., "Sat, 22 Sep 2012 10:23:41 +0000"
  modified: string
  isfolder: boolean
  parentfolderid: number
  icon: string
  ismine: boolean
  isshared: boolean
  isdeleted: boolean
  thumbready?: boolean
  path: string
}

export interface PCloudFileMetadata extends PCloudBaseMetadata {
  isfolder: false // Discriminator
  fileid: number
  size: number
  contenttype: string
  hash: string
  category: number // pCloud uses category integers (0-6)
}

export interface PCloudFolderMetadata extends PCloudBaseMetadata {
  isfolder: true // Discriminator
  folderid: number
}

export type PCloudItemMetadata = PCloudFileMetadata | PCloudFolderMetadata

// When querying listfolder, the requested folder contains a 'contents' array
export interface PCloudFolderContents extends PCloudFolderMetadata {
  contents: PCloudItemMetadata[]
  filecount: number
}

// Type aliases for convenience
export type PCloudFile = PCloudFileMetadata
export type PCloudFolder = PCloudFolderMetadata
export type PCloudListResponse = PCloudListFolderResponse

// 3. Specific API Responses (Flattened)
export interface PCloudUserInfoResponse extends PCloudBaseResponse {
  userid: number
  email: string
  emailverified: boolean
  quota: number
  premium: boolean
  language: string
  // ... other properties exist directly at the root
}

// User Info interface (used by userinfo endpoint)
export interface PCloudUserInfo extends PCloudBaseResponse {
  uid: number
  email: string
  emailverified: boolean
  registered: string // Date string
  premium: boolean
  premiumexpires: string // Date string
  quota: number
  usedquota: number
  language: string
}

export interface PCloudListFolderResponse extends PCloudBaseResponse {
  metadata: PCloudFolderContents
}

export interface PCloudCreateFolderResponse extends PCloudBaseResponse {
  metadata: PCloudFolderMetadata
}

export interface PCloudRenameFolderResponse extends PCloudBaseResponse {
  metadata: PCloudFolderMetadata
}

export interface PCloudDeleteFolderRecursiveResponse extends PCloudBaseResponse {
  deletedfiles: number
  deletedfolders: number
}

export interface PCloudUploadFileResponse extends PCloudBaseResponse {
  metadata: PCloudFileMetadata
}

export interface PCloudDeleteFileResponse extends PCloudBaseResponse {
  deletedfiles: number
}

export interface PCloudFileLinkResponse extends PCloudBaseResponse {
  host: string
  path: string
  expires: string
  ssl: boolean
}

export interface PCloudCopyFileResponse extends PCloudBaseResponse {
  metadata: PCloudFileMetadata
}

export interface PCloudRenameFileResponse extends PCloudBaseResponse {
  metadata: PCloudFileMetadata
}

// 4. Type Guards and Helpers
export function isPCloudSuccess(response: PCloudBaseResponse): boolean {
  return response.result === PCloudResultCode.SUCCESS // Assuming SUCCESS is 0
}

export function getPCloudErrorMessage(response: PCloudBaseResponse): string | undefined {
  if (!isPCloudSuccess(response)) {
    return response.error || `pCloud API error code: ${response.result}`
  }
  return undefined
}
