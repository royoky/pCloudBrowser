/**
 * Maps adapter/domain errors to the neutral HTTP error envelope.
 *
 * Keeps the `statusMessage` aligned with the `ErrorDto.error` codes documented
 * for the neutral API. Already-built H3 errors are passed through unchanged.
 */

import { isError } from 'h3'
import { PCloudApiError } from '~~/server/adapters/pcloud'

function codeForStatus(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST'
    case 401: return 'UNAUTHORIZED'
    case 403: return 'UNAUTHORIZED'
    case 404: return 'NOT_FOUND'
    case 409: return 'CONFLICT'
    case 415: return 'UNSUPPORTED'
    default: return 'PROVIDER_ERROR'
  }
}

export function toHttpError(error: unknown) {
  // Pass through errors already shaped by createError().
  // `isError` is the supported check: the `__h3_error__` marker is a static on
  // the class, so `'__h3_error__' in error` is false for instances and every
  // createError() used to be downgraded to a 500 PROVIDER_ERROR.
  if (isError(error)) {
    return error
  }

  if (error instanceof PCloudApiError) {
    return createError({
      statusCode: error.statusCode,
      statusMessage: codeForStatus(error.statusCode),
      message: error.message,
    })
  }

  return createError({
    statusCode: 500,
    statusMessage: 'PROVIDER_ERROR',
    message: error instanceof Error ? error.message : 'Unknown error',
  })
}
