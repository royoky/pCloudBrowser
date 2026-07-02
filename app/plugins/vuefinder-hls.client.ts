/**
 * VueFinder HLS plugin — attaches HLS.js to VueFinder's video preview player.
 *
 * VueFinder doesn't expose a hook for when its video modal opens (neither
 * double-click nor context menu preview emit a custom event we can intercept),
 * so we watch for the element using a MutationObserver started after mount.
 *
 * Using a plugin rather than a composable in index.vue: this is global app
 * infrastructure with no component-specific concerns. Raw MutationObserver is
 * appropriate here — plugins are allowed to use browser APIs directly, and
 * Nuxt's app:mounted hook replaces onMounted.
 */

import Hls from 'hls.js'

const VIDEO_SELECTOR = '.vuefinder__video-preview__video'

export default defineNuxtPlugin((nuxtApp) => {
  const hlsInstances = new Map<HTMLVideoElement, Hls>()
  let observer: MutationObserver | null = null

  function attach(video: HTMLVideoElement) {
    const src = video.querySelector('source')?.getAttribute('src')
    if (!src)
      return

    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 15, maxMaxBufferLength: 30 })
      hls.loadSource(src)
      hls.attachMedia(video)
      hlsInstances.set(video, hls)
    }
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari supports HLS natively
      video.src = src
    }
  }

  function handleMutations() {
    const video = document.querySelector<HTMLVideoElement>(VIDEO_SELECTOR)
    if (video && !hlsInstances.has(video))
      attach(video)

    // Destroy instances whose element has left the DOM (modal closed)
    for (const [el, hls] of hlsInstances) {
      if (!document.contains(el)) {
        hls.destroy()
        hlsInstances.delete(el)
      }
    }
  }

  nuxtApp.hook('app:mounted', () => {
    observer = new MutationObserver(handleMutations)
    observer.observe(document.body, { childList: true, subtree: true })
  })
})
