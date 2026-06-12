/**
 * HLS proxy utilities.
 *
 * pCloud CDN URLs have `Access-Control-Allow-Origin: my.pcloud.com`, so
 * HLS.js cannot fetch segments directly from the browser. All HLS content
 * is proxied through our server: m3u8 playlists are rewritten so every
 * URL (segment, sub-playlist, audio track) points to our proxy endpoint.
 */

/** Allowed pCloud CDN hostnames for the proxy — prevents open proxy abuse. */
const PCLOUD_CDN = /^https:\/\/[a-z0-9-]+\.pcloud\.com\//

export function isPCloudCdnUrl(url: string): boolean {
  return PCLOUD_CDN.test(url)
}

/**
 * Rewrites every URL in an m3u8 playlist (both plain URL lines and
 * `URI="..."` attributes) to go through our proxy endpoint.
 *
 * @param content   - Raw m3u8 text fetched from pCloud
 * @param baseUrl   - The URL the m3u8 was fetched from (used to resolve relative URLs)
 * @param proxyPath - Our proxy endpoint path, e.g. `/api/pcloud/hls-proxy`
 */
export function rewriteM3u8(content: string, baseUrl: string, proxyPath: string): string {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed)
        return line

      if (trimmed.startsWith('#')) {
        // Rewrite URI="..." attributes inside EXT tags (audio groups, etc.)
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          const abs = new URL(uri, baseUrl).href
          return `URI="${proxyPath}?url=${encodeURIComponent(abs)}"`
        })
      }

      // Plain URL line — resolve relative to base and proxy it
      try {
        const abs = new URL(trimmed, baseUrl).href
        return `${proxyPath}?url=${encodeURIComponent(abs)}`
      }
      catch {
        return line
      }
    })
    .join('\n')
}
