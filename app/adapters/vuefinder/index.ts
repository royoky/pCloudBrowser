/**
 * VueFinder client adapter — public surface.
 *
 * Translates VueFinder's Driver interface to the neutral `/api/{provider}/*`
 * contract. This is the only UI-library-coupled module in the app.
 */

export { createVueFinderDriver } from './driver'
export { toDirEntry, toFsData } from './mapper'
export { neutralParent, toNeutralPath, toVueFinderPath } from './path'
export type { VueFinderDriver } from '~~/shared/types/vuefinder'
