/**
 * pCloud Files API - Updated for Hexagonal Architecture
 *
 * This route now uses the FileRepository abstraction and returns domain entities.
 * It maintains backward compatibility with the existing endpoint structure.
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Only handles file operations
 * - Dependency Injection: Uses repository abstraction
 * - Error Handling: Consistent error responses
 * - Backward Compatibility: Maintains existing endpoint structure
 */

import type { H3Event } from 'h3'
import { z } from 'zod'
import { createPCloudRepository } from '~~/server/adapters/pcloud/repository'

// Schema for download parameters
const downloadParamsSchema = z.object({
  forcedownload: z.coerce.boolean().optional().default(false),
  proxy: z.coerce.boolean().optional().default(false),
})

// Schema for copy body
const copyBodySchema = z.object({
  targetFolderId: z.string(),
  newName: z.string().optional(),
})

// Schema for rename body
const renameBodySchema = z.object({
  newName: z.string().optional(),
  targetFolderId: z.string().optional(),
})

// Helper to get repository from event context
function getRepository(event: H3Event) {
  const auth = event.context.auth

  if (!auth?.token || !auth?.hostname) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  return createPCloudRepository({
    hostname: auth.hostname,
    accessToken: auth.token,
  })
}

// Helper to get path from file ID
function getPathFromId(fileId: string): string {
  // For now, we'll use the ID as part of the path
  // In a full implementation, we'd have a proper path-ID mapping
  if (fileId === '0')
    return '/'
  return `/${fileId}`
}

export default defineEventHandler(async (event: H3Event) => {
  const repository = getRepository(event)
  const fileIdParam = event.context?.params?.fileId

  if (!fileIdParam) {
    throw createError({ statusCode: 400, message: 'File ID is required' })
  }

  // Convert file ID to path
  const path = getPathFromId(fileIdParam)

  switch (event.method) {
    case 'GET': {
      const query = getQuery(event)
      const params = downloadParamsSchema.parse(query)

      try {
        // Get the download URL from the repository
        const downloadUrl = await repository.getDownloadUrl(path)

        // If proxy is requested, redirect or proxy the file
        if (params.proxy) {
          // For proxy mode, we would typically proxy the file through our server
          // For now, we'll just redirect to the pCloud URL
          return sendRedirect(event, downloadUrl, 302)
        }

        // Return the download URL as JSON
        return {
          downloadUrl,
          expires: '', // TODO: Get expiration from pCloud
        }
      }
      catch (error) {
        if (error instanceof Error) {
          throw createError({
            statusCode: 500,
            message: `Failed to get file download link: ${error.message}`,
          })
        }
        throw createError({
          statusCode: 500,
          message: 'Failed to get file download link',
        })
      }
    }

    case 'DELETE': {
      try {
        const result = await repository.delete(path)

        if (!result.success) {
          throw createError({
            statusCode: 500,
            message: result.error || 'Failed to delete file',
          })
        }

        return { success: true }
      }
      catch (error) {
        if (error instanceof Error) {
          throw createError({
            statusCode: 500,
            message: `Failed to delete file: ${error.message}`,
          })
        }
        throw createError({
          statusCode: 500,
          message: 'Failed to delete file',
        })
      }
    }

    case 'PATCH': {
      const body = await readValidatedBody(event, renameBodySchema.parse)

      try {
        const renamedItem = await repository.rename(path, body.newName || '')
        return renamedItem
      }
      catch (error) {
        if (error instanceof Error) {
          throw createError({
            statusCode: 500,
            message: `Failed to rename file: ${error.message}`,
          })
        }
        throw createError({
          statusCode: 500,
          message: 'Failed to rename file',
        })
      }
    }

    case 'POST': {
      const body = await readValidatedBody(event, copyBodySchema.parse)

      try {
        const targetPath = getPathFromId(body.targetFolderId)
        const result = await repository.copy(path, {
          destinationPath: targetPath,
          newName: body.newName,
        })

        if (!result.success) {
          throw createError({
            statusCode: 500,
            message: result.error || 'Failed to copy file',
          })
        }

        return result.item
      }
      catch (error) {
        if (error instanceof Error) {
          throw createError({
            statusCode: 500,
            message: `Failed to copy file: ${error.message}`,
          })
        }
        throw createError({
          statusCode: 500,
          message: 'Failed to copy file',
        })
      }
    }

    default:
      throw createError({ statusCode: 405, message: 'Method not allowed' })
  }
})
