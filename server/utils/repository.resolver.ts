/**
 * Repository Resolver (inbound -> domain wiring)
 *
 * Resolves the `{provider}` route segment to a concrete `FileRepository`
 * outbound adapter, using the auth context populated by server middleware.
 *
 * This is the ONE place that knows which providers exist. Adding a new provider
 * (e.g. Box) is a single entry here plus its adapter — no route changes.
 */

import type { H3Event } from 'h3'
import type { FileRepository } from '~~/shared/domain/ports/file.repository'
import { createPCloudRepository } from '~~/server/adapters/pcloud'

/** Shape the auth middleware writes to `event.context.auth`. */
interface AuthContext {
  token?: string
  hostname?: string
}

type RepositoryFactory = (event: H3Event) => FileRepository

const PROVIDERS: Record<string, RepositoryFactory> = {
  pcloud: (event) => {
    const auth = event.context.auth as AuthContext | undefined

    if (!auth?.token || !auth?.hostname) {
      throw createError({
        statusCode: 401,
        statusMessage: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }

    return createPCloudRepository({
      hostname: auth.hostname,
      accessToken: auth.token,
    })
  },
}

/**
 * Resolves the `FileRepository` for the request's provider.
 *
 * The provider is the second path segment, e.g. `/api/pcloud/list` -> `pcloud`.
 * (Literal per-provider routes mean there's no `[provider]` router param.)
 * Throws a 404 for unknown providers, 401 when not authenticated.
 */
export function resolveRepository(event: H3Event): FileRepository {
  const provider = providerFromPath(event)
  const factory = PROVIDERS[provider]

  if (!factory) {
    throw createError({
      statusCode: 404,
      statusMessage: 'NOT_FOUND',
      message: `Unknown provider: ${provider}`,
    })
  }

  return factory(event)
}

/** Extracts the provider segment: `/api/pcloud/list?...` -> `pcloud`. */
function providerFromPath(event: H3Event): string {
  const segments = event.path.split('?')[0]!.split('/').filter(Boolean)
  // segments[0] === 'api', segments[1] === provider
  return segments[1] ?? ''
}
