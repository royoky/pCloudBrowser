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
} as const

export const PCLOUD_API_BASE_PATHS = {
  API: '/api',
  OAUTH2: '/oauth2',
  USER: '/user',
} as const
