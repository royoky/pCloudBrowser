import type { DateTime } from 'luxon'

export interface ApiResultCode {
  result: number
  error?: string
}

export interface OAuthToken extends ApiResultCode {
  userid: number
  locationid: number
  token_type: string
  access_token: string
}

export interface ListFolderData extends ApiResultCode {
  metadata: PCloudFolder
}

export interface PCloudCommonMetadata {
  path: string
  name: string
  isfolder: boolean
  id: number
  ismine: boolean
  created: string
  modified: string
  thumb: boolean
  isshared: boolean
  icon: string
  parentfolderid: number
}

export interface PCloudFolder extends PCloudCommonMetadata {
  comments: number
  folderid: number
  contents: []
}
export interface PCloudCreateFolderMetadata extends PCloudCommonMetadata {
  folderid: number
}

export interface PCloudFile extends PCloudCommonMetadata {
  contenttype: string
  hash: number
  category: number
  fileid: number
  size: number
}

export interface UserInfo {
  email: string
  emailverified: boolean
  registered: DateTime
  premium: boolean
  premiumexpires: DateTime
  quota: number
  usedquota: number
  language: string
}
