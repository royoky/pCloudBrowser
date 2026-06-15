/**
 * pCloud API Endpoints Constants
 * Based on pCloud HTTP JSON Protocol: https://docs.pcloud.com/protocols/http_json_protocol/
 *
 * Centralized constants for pCloud API endpoints used throughout the server-side code.
 */

export const PCLOUD_API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/userinfo',
    LOGOUT: '/logout',
    TOKEN: '/getauth',
    OAUTH2_TOKEN: '/oauth2_token',
  },
  FILES: {
    LIST: '/listfolder',
    CREATE_FOLDER: '/createfolder',
    COPY_FILE: '/copyfile',
    COPY_FOLDER: '/copyfolder',
    MOVE_FOLDER: '/renamefolder',
    MOVE_FILE: '/renamefile',
    UPLOAD: '/uploadfile',
    // Resumable upload-session API (undocumented over HTTP but OAuth2-compatible,
    // unlike the fileops family which is auth-token only). What pCloud's own
    // client uses for large files; lets us chunk past the platform body limit.
    UPLOAD_CREATE: '/upload_create',
    UPLOAD_WRITE: '/upload_write',
    UPLOAD_SAVE: '/upload_save',
    UPLOAD_LINK: '/createuploadlink', // For generating signed upload URLs
    DOWNLOAD: '/getfilelink',
    FILE_PUBLISH: '/getfilepublink',
    FILE_UNPUBLISH: '/unpublishfile',
    DELETE_FOLDER: '/deletefolderrecursive',
    DELETE_FILE: '/deletefile',
    GET: '/stat', // Get file/folder metadata
  },
  USERS: {
    INFO: '/userinfo',
  },
  SHARED: {
    LIST: '/listshares',
    CREATE: '/createshare',
    MODIFY: '/modifyshare',
    DELETE: '/deleteshare',
  },
  THUMBNAILS: {
    GET: '/getthumb',
    GET_LINK: '/getthumblink',
    GET_LINKS: '/getthumbslinks',
  },
  STREAMING: {
    // Undocumented but used by pCloud's own app — returns HLS + original variants
    TRANSCODE_LINK: '/getmediatranscodelink',
  },
} as const

export const PCLOUD_API_BASE_PATHS = {
  API: '/api',
  OAUTH2: '/oauth2',
  USER: '/user',
} as const
