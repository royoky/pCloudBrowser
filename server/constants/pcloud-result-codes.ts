/**
 * pCloud API result codes.
 *
 * Names and meanings come from the error table of each method page of
 * https://docs.pcloud.com (there is no global table: <https://docs.pcloud.com/errors/>
 * only gives the families). Only the codes this project reacts to are named;
 * everything else is handled by its family, see `httpStatusForResult`.
 * Codes marked "observed" were seen live and are absent from the docs.
 */
export const PCloudResultCode = {
  SUCCESS: 0,

  // 1xxx: the client misbehaved
  LOGIN_REQUIRED: 1000,
  THUMB_TYPE_UNSUPPORTED: 1014, // "Thumb can not be created from this file type."
  INVALID_THUMB_SIZE: 1015,

  // 19xx: often a synchronization problem
  UPLOAD_NOT_FOUND: 1900,

  // 2xxx: invalid operation or bad data
  LOGIN_FAILED: 2000,
  INVALID_NAME: 2001, // "Invalid file/folder name."
  PARENT_NOT_FOUND: 2002, // "A component of parent directory does not exist."
  ACCESS_DENIED: 2003,
  ALREADY_EXISTS: 2004, // "File or folder alredy exists." (copyfile with noover, createfolder...)
  DIRECTORY_NOT_FOUND: 2005, // "Directory does not exist." (listfolder on a missing path or a file)
  FOLDER_NOT_EMPTY: 2006,
  CANNOT_DELETE_ROOT: 2007,
  OVER_QUOTA: 2008,
  FILE_NOT_FOUND: 2009,
  INVALID_PATH: 2010,
  TARGET_FOLDER_NOT_FOUND: 2208, // "Target folder does not exist" (copyfolder)
  FILE_OR_FOLDER_NOT_FOUND: 2055, // observed: stat on a missing path

  // 3xxx: rare errors, retrying is pointless
  THUMB_FAILED: 3001, // "Could not create thumb from the given file." (e.g. a ZIP renamed .png)

  // 4xxx: refusal, usually rate limiting
  TOO_MANY_LOGIN_ATTEMPTS: 4000,

  // 5xxx: temporarily unable to serve, retry later
  INTERNAL_ERROR: 5000,
  INTERNAL_UPLOAD_ERROR: 5001,
  NO_SERVERS: 5002,
} as const

/** HTTP status for the codes we name. */
const HTTP_STATUS_BY_RESULT: Readonly<Record<number, number>> = {
  [PCloudResultCode.SUCCESS]: 200,

  [PCloudResultCode.LOGIN_REQUIRED]: 401,
  [PCloudResultCode.LOGIN_FAILED]: 401,
  [PCloudResultCode.ACCESS_DENIED]: 403,

  [PCloudResultCode.INVALID_THUMB_SIZE]: 400,
  [PCloudResultCode.INVALID_NAME]: 400,
  [PCloudResultCode.INVALID_PATH]: 400,
  [PCloudResultCode.CANNOT_DELETE_ROOT]: 400,

  [PCloudResultCode.UPLOAD_NOT_FOUND]: 404,
  [PCloudResultCode.PARENT_NOT_FOUND]: 404,
  [PCloudResultCode.DIRECTORY_NOT_FOUND]: 404,
  [PCloudResultCode.FILE_NOT_FOUND]: 404,
  [PCloudResultCode.TARGET_FOLDER_NOT_FOUND]: 404,
  [PCloudResultCode.FILE_OR_FOLDER_NOT_FOUND]: 404,

  [PCloudResultCode.ALREADY_EXISTS]: 409,
  [PCloudResultCode.FOLDER_NOT_EMPTY]: 409,

  [PCloudResultCode.OVER_QUOTA]: 402,

  [PCloudResultCode.THUMB_TYPE_UNSUPPORTED]: 415,
  [PCloudResultCode.THUMB_FAILED]: 422,

  [PCloudResultCode.TOO_MANY_LOGIN_ATTEMPTS]: 429,

  [PCloudResultCode.INTERNAL_ERROR]: 503,
  [PCloudResultCode.INTERNAL_UPLOAD_ERROR]: 503,
  [PCloudResultCode.NO_SERVERS]: 503,
}

/**
 * Maps a pCloud result code to an HTTP-like status code.
 *
 * Unnamed codes fall back on their family (see the docs of /errors/): 1xxx and
 * 2xxx are the client's doing (400), 19xx a synchronization problem (409), 3xxx
 * an unprocessable file (422), 4xxx rate limiting (429), 5xxx a temporary
 * outage (503), 7xxx a public link that is gone (404). Anything else, including
 * 6xxx (not errors), is a 500 so the caller gets a clean HTTP error.
 */
export function httpStatusForResult(result: number): number {
  const named = HTTP_STATUS_BY_RESULT[result]
  if (named)
    return named

  if (result >= 1900 && result < 2000)
    return 409
  switch (Math.floor(result / 1000)) {
    case 1:
    case 2: return 400
    case 3: return 422
    case 4: return 429
    case 5: return 503
    case 7: return 404
    default: return 500
  }
}
