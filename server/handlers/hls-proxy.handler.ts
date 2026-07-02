/**
 * HLS proxy handler — GET /api/{provider}/hls-proxy?url=...
 *
 * Proxies pCloud CDN content (m3u8 playlists and .ts segments) to avoid
 * the browser CORS restriction (Access-Control-Allow-Origin: my.pcloud.com).
 *
 * For m3u8 responses, relative URLs are rewritten to point back to this
 * endpoint so HLS.js can continue fetching through our proxy.
 * For segment responses, bytes are piped directly without buffering.
 */

import { z } from 'zod'
import { isPCloudCdnUrl, rewriteM3u8 } from '~~/server/utils/hls'

const querySchema = z.object({
  url: z.url(),
})

function PROXY_PATH(
  event: Parameters<typeof defineEventHandler>[0] extends (event: infer E) => unknown ? E : never,
) {
  return `${event.path.split('?')[0]}`
}

export const hlsProxyHandler = defineEventHandler(async (event) => {
  const { url } = await getValidatedQuery(event, querySchema.parse)

  if (!isPCloudCdnUrl(url)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      message: 'URL not allowed',
    })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) {
    throw createError({
      statusCode: upstream.status,
      statusMessage: 'BAD_GATEWAY',
      message: `Upstream error: ${upstream.statusText}`,
    })
  }

  const contentType = upstream.headers.get('content-type') ?? ''
  const isPlaylist = contentType.includes('mpegurl') || url.includes('.m3u8')

  if (isPlaylist) {
    const content = await upstream.text()
    const proxyPath = PROXY_PATH(event)
    const rewritten = rewriteM3u8(content, url, proxyPath)
    setHeader(event, 'content-type', 'application/vnd.apple.mpegurl')
    setHeader(event, 'cache-control', 'no-cache')
    return send(event, rewritten)
  }

  // Segment: pipe bytes through without buffering
  return sendWebResponse(event, upstream)
})
