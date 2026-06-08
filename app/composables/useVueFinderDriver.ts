import type { VueFinderDriver } from '~/adapters/vuefinder'
import { createVueFinderDriver } from '~/adapters/vuefinder'

/**
 * Provides the VueFinder driver for the active storage provider.
 *
 * The driver is a stateless set of fetch wrappers, so it's created per call
 * (no module-level singleton — keeps it SSR-safe). Currently hardcoded to
 * 'pcloud'; this is where provider selection would plug in later.
 */
export function useVueFinderDriver(): VueFinderDriver {
  return createVueFinderDriver('pcloud')
}
