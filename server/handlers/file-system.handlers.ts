/**
 * Shared, provider-agnostic handlers for the neutral file-system API.
 *
 * Each provider mounts these via thin literal routes (e.g.
 * `server/api/pcloud/list.get.ts` re-exports `listHandler`). We use literal
 * per-provider routes rather than a dynamic `[provider]` segment because the
 * OAuth callback lives at `/api/pcloud/auth/callback`, which creates a static
 * `pcloud` route node; Nitro's router won't fall back from that static node to
 * a `[provider]` sibling, so `/api/pcloud/*` would never reach a dynamic route.
 *
 * The handlers are provider-agnostic: `resolveRepository` derives the provider
 * from the request path.
 */

import type { H3Event } from 'h3'
import type {
  BatchResultDto,
  ContentDto,
  SaveResultDto,
  SearchResultDto,
} from '~~/shared/contracts/file-system.dto'
import type { FileRepository } from '~~/shared/domain/ports/file.repository'

import { z } from 'zod'
import {
  toFolderListing,
  toItemDto,
  toOperationResult,
} from '~~/server/presenters/file-system.presenter'
import { rewriteM3u8 } from '~~/server/utils/hls'
import { toHttpError } from '~~/server/utils/http-error'
import { resolveRepository } from '~~/server/utils/repository.resolver'

const listQuerySchema = z.object({
  path: z.string().optional().default('/'),
})

const requiredPathSchema = z.object({
  path: z.string().min(1),
})

const transferBodySchema = z.object({
  sources: z.array(z.string()).min(1),
  destinationPath: z.string(),
  overwrite: z.boolean().optional(),
})

const deleteBodySchema = z.object({
  paths: z.array(z.string()).min(1),
  permanent: z.boolean().optional(),
})

const createFolderBodySchema = z.object({
  parentPath: z.string(),
  name: z.string().min(1),
})
type CreateFolderBody = z.infer<typeof createFolderBodySchema>

const createFileBodySchema = z.object({
  parentPath: z.string(),
  name: z.string().min(1),
})
type CreateFileBody = z.infer<typeof createFileBodySchema>

const saveFileBodySchema = z.object({
  path: z.string().min(1),
  content: z.string(),
})
type SaveFileBody = z.infer<typeof saveFileBodySchema>

const renameBodySchema = z.object({
  path: z.string(),
  newName: z.string().min(1),
})

const searchQuerySchema = z.object({
  query: z.string().min(1),
  path: z.string().optional().default('/'),
  // Query params arrive as strings; only "true" means recursive.
  recursive: z
    .string()
    .optional()
    .transform(value => value === 'true'),
  type: z.enum(['file', 'folder', 'both']).optional().default('both'),
})

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

/** Runs a copy/move batch, reporting a per-source outcome. */
async function runTransfer(event: H3Event, op: 'copy' | 'move'): Promise<BatchResultDto> {
  const repository: FileRepository = resolveRepository(event)
  const { sources, destinationPath, overwrite } = await readValidatedBody(
    event,
    transferBodySchema.parse,
  )

  const results = await Promise.all(
    sources.map(async (sourcePath) => {
      try {
        const result = await repository[op](sourcePath, { destinationPath, overwrite })
        return toOperationResult(sourcePath, result)
      }
      catch (error) {
        return { path: sourcePath, success: false, error: errorMessage(error) }
      }
    }),
  )

  return { results }
}

/** GET /api/{provider}/list?path=/Documents */
export const listHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const { path } = await getValidatedQuery(event, listQuerySchema.parse)

  try {
    return toFolderListing(await repository.list(path))
  }
  catch (error) {
    throw toHttpError(error)
  }
})

/** POST /api/{provider}/copy  { sources, destinationPath, overwrite? } */
export const copyHandler = defineEventHandler(event => runTransfer(event, 'copy'))

/** POST /api/{provider}/move  { sources, destinationPath, overwrite? } */
export const moveHandler = defineEventHandler(event => runTransfer(event, 'move'))

/** POST /api/{provider}/delete  { paths, permanent? } */
export const deleteHandler = defineEventHandler(async (event): Promise<BatchResultDto> => {
  const repository = resolveRepository(event)
  const { paths, permanent } = await readValidatedBody(event, deleteBodySchema.parse)

  const results = await Promise.all(
    paths.map(async (path) => {
      try {
        return toOperationResult(path, await repository.delete(path, permanent))
      }
      catch (error) {
        return { path, success: false, error: errorMessage(error) }
      }
    }),
  )

  return { results }
})

/** POST /api/{provider}/create-folder  { parentPath, name } */
export const createFolderHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const body = await readValidatedBody(event, createFolderBodySchema.parse) as CreateFolderBody

  try {
    return toItemDto(await repository.createFolder(body))
  }
  catch (error) {
    throw toHttpError(error)
  }
})

/** POST /api/{provider}/create-file  { parentPath, name } */
export const createFileHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const body = await readValidatedBody(event, createFileBodySchema.parse) as CreateFileBody

  try {
    return toItemDto(await repository.createFile(body))
  }
  catch (error) {
    throw toHttpError(error)
  }
})

/** POST /api/{provider}/save-file  { path, content } */
export const saveFileHandler = defineEventHandler(async (event): Promise<SaveResultDto> => {
  const repository = resolveRepository(event)
  const body = await readValidatedBody(event, saveFileBodySchema.parse) as SaveFileBody

  try {
    await repository.writeFileContent(body)
    return { success: true }
  }
  catch (error) {
    throw toHttpError(error)
  }
})

/** PATCH /api/{provider}/items  { path, newName } */
export const renameHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const { path, newName } = await readValidatedBody(event, renameBodySchema.parse)

  try {
    return toItemDto(await repository.rename(path, newName))
  }
  catch (error) {
    throw toHttpError(error)
  }
})

/** GET /api/{provider}/search?query=&path=&recursive=&type= */
export const searchHandler = defineEventHandler(async (event): Promise<SearchResultDto> => {
  const repository = resolveRepository(event)
  const { query, path, recursive, type } = await getValidatedQuery(event, searchQuerySchema.parse)

  try {
    const items = await repository.search({ query, path, recursive, type })
    return { items: items.map(toItemDto) }
  }
  catch (error) {
    throw toHttpError(error)
  }
})

/** GET /api/{provider}/content?path=/notes.txt */
export const contentHandler = defineEventHandler(async (event): Promise<ContentDto> => {
  const repository = resolveRepository(event)
  const { path } = await getValidatedQuery(event, requiredPathSchema.parse)

  try {
    const [content, item] = await Promise.all([
      repository.getContent(path),
      repository.getByPath(path),
    ])
    const mimeType = item?.type === 'file' ? item.mimeType : 'text/plain'
    return { content, mimeType }
  }
  catch (error) {
    throw toHttpError(error)
  }
})

/** GET /api/{provider}/download?path=… -> 302 redirect to the signed URL */
export const downloadHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const { path } = await getValidatedQuery(event, requiredPathSchema.parse)

  try {
    return await sendRedirect(event, await repository.getDownloadUrl(path), 302)
  }
  catch (error) {
    throw toHttpError(error)
  }
})

// Short-lived cache for signed pCloud CDN URLs so seeking a video doesn't
// trigger a fresh /stat + /getfilelink pair on every range request.
const videoUrlCache = new Map<string, { url: string, expiresAt: number }>()

// .ts is MPEG-2 Transport Stream here, not TypeScript — pCloud stores media,
// and the HLS/range proxy degrades gracefully if the file turns out to be text.
const VIDEO_EXTENSIONS = new Set([
  '3g2',
  '3gp',
  'asf',
  'avi',
  'flv',
  'm2ts',
  'm2v',
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'mpeg',
  'mpg',
  'mts',
  'ogg',
  'ogv',
  'ts',
  'webm',
  'wmv',
])

function isVideoPath(path: string): boolean {
  return VIDEO_EXTENSIONS.has(path.split('.').pop()?.toLowerCase() ?? '')
}

async function getCachedVideoUrl(event: H3Event, path: string): Promise<string> {
  const cached = videoUrlCache.get(path)
  if (cached && cached.expiresAt > Date.now())
    return cached.url

  const repository = resolveRepository(event)
  const url = await repository.getDownloadUrl(path)
  // Cache for 4 minutes (pCloud signed URLs typically expire after 5+)
  videoUrlCache.set(path, { url, expiresAt: Date.now() + 4 * 60 * 1000 })
  return url
}

/**
 * Proxies a video range request to pCloud's CDN.
 *
 * A 302 redirect is not enough for video — pCloud CDN URLs have a referrer
 * restriction that blocks browser-originated requests. Proxying server-side
 * avoids that, and forwarding Range headers enables seeking.
 *
 * When Chrome requests bytes=0- (open-ended), it receives the entire file as
 * one stream and gives up before finding the moov atom if the file is
 * non-faststart (moov at end). Capping the initial range to 64KB forces
 * Chrome's media engine to close that connection and issue a targeted second
 * request for the end of the file where moov lives.
 *
 * Uses sendWebResponse which accepts a native Response and streams the body
 * without buffering — memory cost is bounded by chunk size, not file size.
 */
async function proxyVideoStream(event: H3Event, cdnUrl: string): Promise<void> {
  let range = getHeader(event, 'range')

  // Cap open-ended initial probe to 64 KB so Chrome is forced to make
  // targeted range requests rather than streaming the whole file.
  if (range === 'bytes=0-')
    range = 'bytes=0-65535'

  const headers: Record<string, string> = {}
  if (range)
    headers.range = range

  const upstream = await fetch(cdnUrl, { headers })

  if (!upstream.headers.has('accept-ranges'))
    upstream.headers.set('accept-ranges', 'bytes')

  return sendWebResponse(event, upstream)
}

/**
 * Fetches an m3u8 playlist from pCloud, rewrites all URLs to our proxy
 * endpoint, and returns it with the correct content type.
 */
async function proxyM3u8(event: H3Event, m3u8Url: string): Promise<void> {
  const upstream = await fetch(m3u8Url)
  if (!upstream.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: 'BAD_GATEWAY',
      message: 'Failed to fetch HLS playlist from upstream',
    })
  }
  const content = await upstream.text()
  // Derive the provider segment from the request path so the proxy URL
  // stays consistent regardless of which provider is active.
  const provider = event.path.split('/')[2] // /api/{provider}/preview
  const proxyPath = `/api/${provider}/hls-proxy`
  const rewritten = rewriteM3u8(content, m3u8Url, proxyPath)
  setHeader(event, 'content-type', 'application/vnd.apple.mpegurl')
  setHeader(event, 'cache-control', 'no-cache')
  return send(event, rewritten)
}

/** GET /api/{provider}/preview?path=… */
export const previewHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const { path } = await getValidatedQuery(event, requiredPathSchema.parse)

  try {
    if (isVideoPath(path)) {
      // Try HLS first (proper adaptive streaming, no CORS or range issues).
      // Falls back to range proxy if transcoding is unavailable.
      const streamUrl = await repository.getStreamUrl(path)
      if (streamUrl)
        return proxyM3u8(event, streamUrl)

      const cdnUrl = await getCachedVideoUrl(event, path)
      return proxyVideoStream(event, cdnUrl)
    }

    const url = await repository.getPreviewUrl(path)
    if (!url) {
      throw createError({
        statusCode: 415,
        statusMessage: 'UNSUPPORTED',
        message: 'No preview available for this file',
      })
    }
    // Proxy the image server-side: a 302 redirect would send the browser
    // directly to eth*.pcloud.com, where pCloud cookies are auto-sent and
    // Chrome's ORB blocks the cross-origin opaque response.
    const upstream = await fetch(url)
    if (!upstream.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: 'BAD_GATEWAY',
        message: 'Upstream preview unavailable',
      })
    }
    setHeader(event, 'content-type', upstream.headers.get('content-type') ?? 'image/jpeg')
    setHeader(event, 'cache-control', 'public, max-age=3600')
    return sendWebResponse(event, upstream)
  }
  catch (error) {
    throw toHttpError(error)
  }
})
