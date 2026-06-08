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
  SearchResultDto,
} from '~~/shared/contracts/file-system.dto'

import type { FileRepository } from '~~/shared/domain/ports/file.repository'
import { z } from 'zod'
import {
  toFolderListing,
  toItemDto,
  toOperationResult,
} from '~~/server/presenters/file-system.presenter'
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

const renameBodySchema = z.object({
  path: z.string(),
  newName: z.string().min(1),
})

const searchQuerySchema = z.object({
  query: z.string().min(1),
  path: z.string().optional().default('/'),
  // Query params arrive as strings; only "true" means recursive.
  recursive: z.string().optional().transform(value => value === 'true'),
  type: z.enum(['file', 'folder', 'both']).optional().default('both'),
})

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

/** Runs a copy/move batch, reporting a per-source outcome. */
async function runTransfer(
  event: H3Event,
  op: 'copy' | 'move',
): Promise<BatchResultDto> {
  const repository: FileRepository = resolveRepository(event)
  const { sources, destinationPath, overwrite }
    = await readValidatedBody(event, transferBodySchema.parse)

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
  const { parentPath, name } = await readValidatedBody(event, createFolderBodySchema.parse)

  try {
    return toItemDto(await repository.createFolder(parentPath, name))
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

/** GET /api/{provider}/preview?path=… -> 302 redirect, or 415 if not previewable */
export const previewHandler = defineEventHandler(async (event) => {
  const repository = resolveRepository(event)
  const { path } = await getValidatedQuery(event, requiredPathSchema.parse)

  try {
    const url = await repository.getPreviewUrl(path)
    if (!url) {
      throw createError({
        statusCode: 415,
        statusMessage: 'UNSUPPORTED',
        message: 'No preview available for this file',
      })
    }
    return await sendRedirect(event, url, 302)
  }
  catch (error) {
    throw toHttpError(error)
  }
})
