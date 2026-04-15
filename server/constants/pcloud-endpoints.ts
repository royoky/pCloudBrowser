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
    COPY: '/copyfile',
    MOVE: '/renamefile',
    UPLOAD: '/uploadfile',
    UPLOAD_LINK: '/createuploadlink', // For generating signed upload URLs
    DOWNLOAD: '/getfilelink',
    FILE_PUBLISH: '/getfilepublink',
    FILE_UNPUBLISH: '/unpublishfile',
    DELETE_FOLDER: '/deletefolderrecursive',
    DELETE_FILE: '/deletefile',
    COPY_FOLDER: '/copyfolder',
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
  },
} as const

export const PCLOUD_API_BASE_PATHS = {
  API: '/api',
  OAUTH2: '/oauth2',
  USER: '/user',
} as const
