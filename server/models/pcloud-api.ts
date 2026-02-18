/**
 * pCloud API Base Model - Server Side
 * Based on pCloud HTTP JSON Protocol: https://docs.pcloud.com/protocols/http_json_protocol/
 *
 * This model provides TypeScript interfaces for the pCloud API responses and requests,
 * following their JSON protocol specification. Used exclusively by server-side code.
 */

import { PCloudResultCode } from '../constants/pcloud-result-codes'

// Type for error result codes (all non-zero codes)
export type PCloudErrorResultCode
  = | PCloudResultCode.ERROR
    | PCloudResultCode.PARTIAL_ERROR
    | PCloudResultCode.AUTHORIZATION_ERROR
    | PCloudResultCode.NOT_FOUND
    | PCloudResultCode.ALREADY_EXISTS
    | PCloudResultCode.INVALID_PARAMS
    | PCloudResultCode.RATE_LIMIT
    | PCloudResultCode.MAINTENANCE
    | PCloudResultCode.FILE_TOO_LARGE
    | PCloudResultCode.STORAGE_QUOTA_EXCEEDED
    | PCloudResultCode.SHARE_NOT_FOUND
    | PCloudResultCode.SHARE_PERMISSION_DENIED

export interface PCloudApiResponse<T = any> {
  result: number
  metadata?: Record<string, any>
  error?: string
  data?: T
}

export interface PCloudErrorResponse extends PCloudApiResponse<never> {
  result: PCloudErrorResultCode
  error: string
}

export interface PCloudSuccessResponse<T = any> extends PCloudApiResponse<T> {
  result: PCloudResultCode.SUCCESS
  metadata?: Record<string, any>
  data?: T
}

// Discriminated union for better type safety
export type PCloudResponse<T = any>
  = | PCloudSuccessResponse<T>
    | PCloudErrorResponse

// Common parameter types
export interface PCloudAuthParams {
  username?: string
  password?: string
  auth?: string
  getauth?: number
  logout?: number
}

export interface PCloudFileParams {
  path?: string
  folderid?: number
  name?: string
  create?: number
  recursive?: number
}

export interface PCloudListParams {
  path?: string
  folderid?: number
  recursive?: number
  no_files?: number
  no_folders?: number
  no_shares?: number
  no_deleted?: number
}

// Common response types
export interface PCloudUserInfo extends PCloudApiResponse<PCloudUserInfo> {
  userid: number
  email: string
  emailverified: boolean
  name: string
  usedquota: number
  quota: number
  plan: number
  business: number
  premium: number
  premiumexpires?: string
  registered: string
  language: string
  publiclinkquota: number
  usedpubliclinkquota: number
  teamfoldersquota: number
  usedteamfoldersquota: number
}

export interface PCloudFile {
  id: number
  parentfolderid: number
  name: string
  isfolder: boolean
  created: string
  modified: string
  size: number
  contenttype: string
  hash: string
  icon: string
  fileid: number
  folderid: number
  thumb?: boolean
  ismine: boolean
  isshared: boolean
  issynced: boolean
}

export interface PCloudFolder extends PCloudFile {
  isfolder: true
  filecount: number
  childcount: number
}

export interface PCloudListResponse extends PCloudApiResponse<PCloudListResponse> {
  metadata: {
    name: string
    ismine: boolean
    isshared: boolean
    canwrite: boolean
    cancreate: boolean
    isdeleted: boolean
    isinherited: boolean
    path: string
    folderid: number
    parentfolderid: number
  }
  contents: PCloudFile[]
}

export interface PCloudAuthResponse extends PCloudApiResponse<PCloudAuthResponse> {
  auth: string
  userid: number
  location: number
}

export interface PCloudTokenResponse extends PCloudApiResponse<PCloudTokenResponse> {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  uid: number
  locationid: number
  hostname?: string
  business?: number
  email?: string
}

// Response type for delete operations
export interface PCloudDeleteResponse extends PCloudApiResponse<PCloudDeleteResponse> {
  metadata?: {
    deleted?: number
    failed?: number
  }
}

// Helper functions
export function isPCloudSuccess(
  response: PCloudResponse,
): response is PCloudSuccessResponse {
  return response.result === PCloudResultCode.SUCCESS
}

export function isPCloudError(
  response: PCloudResponse,
): response is PCloudErrorResponse {
  return response.result !== PCloudResultCode.SUCCESS
}

export function getPCloudErrorMessage(
  response: PCloudResponse,
): string | undefined {
  if (isPCloudError(response)) {
    return response.error || `pCloud API error: ${response.result}`
  }
  return undefined
}

export function createPCloudError(
  error: string,
  code: PCloudErrorResultCode = PCloudResultCode.ERROR,
): PCloudErrorResponse {
  return {
    result: code,
    error,
  }
}

export function createPCloudSuccess<T>(
  data?: T,
  metadata?: Record<string, any>,
): PCloudSuccessResponse<T> {
  return {
    result: PCloudResultCode.SUCCESS,
    data,
    metadata,
  }
}

// Type guard for handling API responses
export function handlePCloudResponse<T>(
  response: PCloudResponse<T>,
  successCallback: (data: T, metadata?: Record<string, any>) => void,
  errorCallback: (
    error: string,
    code: number,
    metadata?: Record<string, any>,
  ) => void,
): void {
  if (isPCloudSuccess(response)) {
    successCallback(response.data as T, response.metadata)
  }
  else {
    errorCallback(response.error, response.result, response.metadata)
  }
}
