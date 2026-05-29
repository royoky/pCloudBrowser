/**
 * Files API - List/GET endpoint
 * 
 * Handles GET requests for listing files and folders.
 * This endpoint uses the FileRepository abstraction.
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Only handles GET requests for file listing
 * - Dependency Injection: Receives repository via context
 * - Error Handling: Consistent error responses
 */

import type { H3Event } from 'h3';
import type { FileRepository } from '../../../adapters/pcloud/repository';
import { createPCloudRepository } from '../../../adapters/pcloud/repository';

// Helper to get repository from event context
function getRepository(event: H3Event): FileRepository {
  // In a real app, you'd use dependency injection
  // For now, we create a new instance with auth from context
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

export default defineEventHandler(async (event: H3Event) => {
  const repository = getRepository(event);
  const pathParam = getRouterParam(event, 'path') || '/';
  
  // Decode the path parameter
  const path = decodeURIComponent(pathParam);

  try {
    // List the directory
    const folder = await repository.list(path);
    
    return folder;
  } catch (error) {
    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        message: `Failed to list directory: ${error.message}`,
      });
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to list directory',
    });
  }
});
