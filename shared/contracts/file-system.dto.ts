/**
 * Neutral File-System API Contract (DTOs)
 *
 * This is the wire contract for the `/api/{provider}/*` endpoints — the stable
 * boundary that is owned by us and knows about NEITHER a cloud provider (pCloud,
 * Box, ...) NOR a UI library (VueFinder, Syncfusion, ...).
 *
 * It is the `FileRepository` domain port projected over HTTP:
 *  - the server maps its domain entities -> these DTOs (see file-system.presenter)
 *  - a client UI adapter maps these DTOs -> whatever its file-manager expects
 *
 * Serialization rules (the boundary that must be explicit):
 *  - timestamps are ISO 8601 UTC strings, never `Date`
 *  - sizes are bytes (number)
 *  - paths are absolute, '/'-rooted, forward slashes, no trailing slash
 */

/** Discriminated union returned wherever a single item is returned. */
export type FileSystemItemDto = FileDto | FolderDto

interface FileSystemItemBaseDto {
  /** Opaque, provider-native id (e.g. pCloud fileid/folderid). Not used for addressing. */
  id: string
  /** Display name, e.g. "file.txt". */
  name: string
  /** Absolute, provider-agnostic path, e.g. "/Documents/file.txt". */
  path: string
  /** ISO 8601 UTC. */
  createdAt: string
  /** ISO 8601 UTC. */
  modifiedAt: string
}

export interface FileDto extends FileSystemItemBaseDto {
  type: 'file'
  /** Size in bytes. */
  size: number
  /** MIME type, e.g. "text/plain". */
  mimeType: string
  /** Lowercase extension without the dot, "" when none. */
  extension: string
  hasThumbnail?: boolean
}

export interface FolderDto extends FileSystemItemBaseDto {
  type: 'folder'
  /** Number of direct children. */
  itemCount: number
  /** Direct children — populated by `/list`, omitted elsewhere. */
  children?: FileSystemItemDto[]
}

/** Per-item outcome for batch operations (delete / copy / move). */
export interface OperationResultDto {
  /** The source path that was acted on. */
  path: string
  success: boolean
  /** Resulting item when relevant (e.g. the copy at its destination). */
  item?: FileSystemItemDto
  error?: string
}

export interface BatchResultDto {
  results: OperationResultDto[]
}

export interface SearchResultDto {
  items: FileSystemItemDto[]
}

export interface ContentDto {
  content: string
  mimeType: string
}

export interface UrlDto {
  url: string
}

/** Uniform error envelope for non-2xx responses. */
export interface ErrorDto {
  statusCode: number
  /** Machine-readable code, e.g. "NOT_FOUND". */
  error: string
  /** Human-readable message. */
  message: string
}
