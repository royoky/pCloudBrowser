/**
 * pCloud Folders API - Updated for Hexagonal Architecture
 * 
 * This route now uses the FileRepository abstraction and returns domain entities.
 * It maintains backward compatibility with the existing endpoint structure.
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Only handles folder operations
 * - Dependency Injection: Uses repository abstraction
 * - Error Handling: Consistent error responses
 * - Backward Compatibility: Maintains existing endpoint structure
 */

import type { H3Event } from 'h3';
import { z } from 'zod';
import { createPCloudRepository } from '~~/server/adapters/pcloud/repository';
import { FileSystemPath } from '~~/shared/domain/models/file-system.entity';

// Schema for request body validation
const folderBodySchema = z.object({
  newName: z.string().optional(),
  targetFolderId: z.string().optional(),
});

// Helper to get repository from event context
function getRepository(event: H3Event) {
  const auth = event.context.auth;
  
  if (!auth?.token || !auth?.hostname) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    });
  }

  return createPCloudRepository({
    hostname: auth.hostname,
    accessToken: auth.token,
  });
}

// Helper to map pCloud result codes to HTTP status codes
function getHttpStatusCode(pcloudResult: number): number {
  switch (pcloudResult) {
    case 1000:
    case 2000:
      return 401; // Unauthorized / Login failed
    case 2003:
      return 403; // Access denied
    case 2005:
      return 404; // Directory does not exist
    case 2004:
      return 409; // File/Folder already exists
    default:
      return 500; // Internal/Unknown
  }
}

// Helper to create error responses
function createPCloudError(response: { result: number; error?: string }): Error {
  const statusCode = getHttpStatusCode(response.result);
  const message = response.error || 'Folder operation failed';
  
  const error = createError({
    statusCode,
    message,
  });
  
  return error;
}

export default defineEventHandler(async (event: H3Event) => {
  const repository = getRepository(event);
  const folderId = event.context?.params?.folderId;
  const query = getQuery(event);

  // For path-based operations, we'll use '/' as root
  // For ID-based operations, we'll convert ID to path
  const getPathFromId = (id: string | undefined): string => {
    if (!id) return '/';
    // If folderId is '0', it's the root
    if (id === '0') return '/';
    // Otherwise, it's a numeric ID - we'll use it as path for now
    // In a full implementation, we'd have a proper path-ID mapping
    return `/${id}`;
  };

  const path = getPathFromId(folderId);

  switch (event.method) {
    case 'GET': {
      // Validate folderId parameter
      if (!folderId) {
        throw createError({
          statusCode: 400,
          message: 'Folder ID is required',
        });
      }

      try {
        const folder = await repository.list(path);
        return folder;
      } catch (error) {
        if (error instanceof Error) {
          throw createError({
            statusCode: 500,
            message: `Failed to list folder: ${error.message}`,
          });
        }
        throw createError({
          statusCode: 500,
          message: 'Failed to list folder',
        });
      }
    }

    case 'POST': {
      // Create new folder
      const body = await readValidatedBody(event, folderBodySchema.parse);
      
      if (!body.newName) {
        throw createError({
          statusCode: 400,
          message: 'Folder name is required',
        });
      }

      try {
        const parentPath = path;
        const folder = await repository.createFolder(parentPath, body.newName);
        return folder;
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          throw createError({
            statusCode: 409,
            message: error.message,
          });
        }
        throw createError({
          statusCode: 500,
          message: `Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    case 'PUT': {
      // Move/Rename folder
      const body = await readValidatedBody(event, folderBodySchema.parse);
      
      if (!body.newName && !body.targetFolderId) {
        throw createError({
          statusCode: 400,
          message: 'Either newName or targetFolderId must be provided',
        });
      }

      try {
        let newPath = path;
        
        if (body.newName) {
          // Rename operation
          const currentItem = await repository.getByPath(path);
          if (!currentItem) {
            throw createError({
              statusCode: 404,
              message: 'Folder not found',
            });
          }
          
          newPath = FileSystemPath.join(
            FileSystemPath.getParent(path),
            body.newName
          );
          const renamedItem = await repository.rename(path, body.newName);
          return renamedItem;
        } else if (body.targetFolderId) {
          // Move operation
          const targetPath = getPathFromId(body.targetFolderId);
          const movedItem = await repository.move(path, {
            destinationPath: targetPath,
          });
          return movedItem;
        }
      } catch (error) {
        if (error instanceof Error) {
          throw createError({
            statusCode: 500,
            message: `Failed to update folder: ${error.message}`,
          });
        }
        throw createError({
          statusCode: 500,
          message: 'Failed to update folder',
        });
      }
    }

    case 'DELETE': {
      try {
        const result = await repository.delete(path);
        
        if (!result.success) {
          throw createError({
            statusCode: 500,
            message: result.error || 'Failed to delete folder',
          });
        }

        // Return success response with deleted item
        return {
          success: true,
          item: result.item,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw createError({
            statusCode: 500,
            message: `Failed to delete folder: ${error.message}`,
          });
        }
        throw createError({
          statusCode: 500,
          message: 'Failed to delete folder',
        });
      }
    }

    default:
      throw createError({ statusCode: 405, message: 'Method not allowed' });
  }
});
