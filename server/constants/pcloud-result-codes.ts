/**
 * pCloud API Result Codes
 * Based on pCloud HTTP JSON Protocol: https://docs.pcloud.com/protocols/http_json_protocol/
 *
 * Standard result codes returned by the pCloud API.
 */

export enum PCloudResultCode {
  // Success
  SUCCESS = 0,

  // General errors
  ERROR = 1,
  PARTIAL_ERROR = 2,

  // Authentication errors
  AUTHORIZATION_ERROR = 1000,

  // Resource errors
  NOT_FOUND = 2000,
  ALREADY_EXISTS = 2001,

  // Parameter errors
  INVALID_PARAMS = 2002,

  // Rate limiting
  RATE_LIMIT = 2003,

  // Service status
  MAINTENANCE = 2004,

  // File operation specific errors
  FILE_TOO_LARGE = 2005,
  STORAGE_QUOTA_EXCEEDED = 2006,

  // Sharing errors
  SHARE_NOT_FOUND = 2007,
  SHARE_PERMISSION_DENIED = 2008,

  // Observed in practice (absent from public docs): path-based lookup on a non-existent item
  FILE_OR_FOLDER_NOT_FOUND = 2055,
}

export const PCLOUD_ERROR_MESSAGES: Record<PCloudResultCode, string> = {
  [PCloudResultCode.SUCCESS]: 'Success',
  [PCloudResultCode.ERROR]: 'General error',
  [PCloudResultCode.PARTIAL_ERROR]: 'Partial error',
  [PCloudResultCode.AUTHORIZATION_ERROR]: 'Authorization required',
  [PCloudResultCode.NOT_FOUND]: 'Resource not found',
  [PCloudResultCode.ALREADY_EXISTS]: 'Resource already exists',
  [PCloudResultCode.INVALID_PARAMS]: 'Invalid parameters',
  [PCloudResultCode.RATE_LIMIT]: 'Rate limit exceeded',
  [PCloudResultCode.MAINTENANCE]: 'Service under maintenance',
  [PCloudResultCode.FILE_TOO_LARGE]: 'File too large',
  [PCloudResultCode.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded',
  [PCloudResultCode.SHARE_NOT_FOUND]: 'Share not found',
  [PCloudResultCode.SHARE_PERMISSION_DENIED]: 'Share permission denied',
  [PCloudResultCode.FILE_OR_FOLDER_NOT_FOUND]: 'File or folder not found.',
} as const
