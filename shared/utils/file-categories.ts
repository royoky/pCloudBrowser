/**
 * File Category Utilities
 *
 * Provider-agnostic file categorization based on extensions and MIME types
 */

// Define the category configuration type
interface FileCategoryConfig {
  extensions: readonly string[]
  mimeTypes: readonly string[]
  icon: string
  previewable: boolean
  editable: boolean
}

// Define the categories with proper typing
const FILE_CATEGORIES_CONFIG: Record<string, FileCategoryConfig> = {
  image: {
    extensions: [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'svg',
      'bmp',
      'tiff',
    ],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    icon: 'mdi-image',
    previewable: true,
    editable: false,
  },
  document: {
    extensions: [
      'pdf',
      'doc',
      'docx',
      'txt',
      'rtf',
      'odt',
      'ods',
      'odp',
    ],
    mimeTypes: ['application/pdf', 'text/plain', 'application/msword'] as const,
    icon: 'mdi-file-document',
    previewable: true,
    editable: true,
  },
  audio: {
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'] as const,
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'] as const,
    icon: 'mdi-music',
    previewable: true,
    editable: false,
  },
  video: {
    extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'] as const,
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'] as const,
    icon: 'mdi-video',
    previewable: true,
    editable: false,
  },
  archive: {
    extensions: ['zip', 'rar', 'tar', 'gz', '7z', 'bz2'] as const,
    mimeTypes: ['application/zip', 'application/x-rar-compressed'] as const,
    icon: 'mdi-folder-zip',
    previewable: false,
    editable: false,
  },
  code: {
    extensions: [
      'js',
      'ts',
      'html',
      'css',
      'json',
      'md',
      'yaml',
      'yml',
      'xml',
      'php',
      'py',
      'java',
      'c',
      'cpp',
      'cs',
      'go',
      'rb',
      'swift',
    ],
    mimeTypes: ['text/plain', 'application/json', 'text/x-typescript'] as const,
    icon: 'mdi-code-tags',
    previewable: true,
    editable: true,
  },
} as const

// Extract the category names as a type
export type FileCategory = keyof typeof FILE_CATEGORIES_CONFIG | 'unknown'

// Type-safe function to get category by extension
export function getFileCategory(extension: string): {
  name: FileCategory
  icon: string
  previewable: boolean
  editable: boolean
} {
  const ext = extension.toLowerCase().replace(/^\./, '')

  // Use Object.entries with proper typing
  for (const [category, config] of Object.entries(FILE_CATEGORIES_CONFIG)) {
    // Use some() instead of includes() for better type safety
    if (config.extensions.includes(ext)) {
      return {
        name: category as FileCategory,
        icon: config.icon,
        previewable: config.previewable,
        editable: config.editable,
      }
    }
  }

  return {
    name: 'unknown',
    icon: 'mdi-file-question',
    previewable: false,
    editable: false,
  }
}

// Type-safe function to get category by MIME type
export function getCategoryByMimeType(mimeType: string): FileCategory {
  for (const [category, config] of Object.entries(FILE_CATEGORIES_CONFIG)) {
    if (config.mimeTypes.includes(mimeType)) {
      return category as FileCategory
    }
  }
  return 'unknown'
}

// Export the categories for direct use if needed
export const FILE_CATEGORIES = FILE_CATEGORIES_CONFIG
