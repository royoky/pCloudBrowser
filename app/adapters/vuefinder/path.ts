/**
 * Path translation between the neutral API and VueFinder.
 *
 * Neutral API: absolute, '/'-rooted     ── "/", "/Documents", "/Documents/a.txt"
 * VueFinder:   "{storage}://{relative}"  ── "pcloud://", "pcloud://Documents"
 *
 * VueFinder's storage root is "{storage}://" and the relative part has no
 * leading slash (verified against VueFinder's own ArrayDriver).
 */

/** Neutral absolute path -> VueFinder "{storage}://relative". */
export function toVueFinderPath(storage: string, neutralPath: string): string {
  const relative = trimSlashes(neutralPath)
  return relative ? `${storage}://${relative}` : `${storage}://`
}

/** VueFinder path (or undefined) -> neutral absolute path. */
export function toNeutralPath(storage: string, vueFinderPath: string | undefined): string {
  if (!vueFinderPath)
    return '/'
  const relative = trimSlashes(vueFinderPath.replace(`${storage}://`, ''))
  return relative ? `/${relative}` : '/'
}

/** Parent of a neutral absolute path. "/a/b" -> "/a", "/a" -> "/", "/" -> "/". */
export function neutralParent(neutralPath: string): string {
  const segments = neutralPath.split('/').filter(Boolean)
  return segments.length <= 1 ? '/' : `/${segments.slice(0, -1).join('/')}`
}

function trimSlashes(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/, '')
}
