/**
 * VueFinder Client Plugin
 *
 * Registers VueFinder component globally for client-side use only.
 * This is necessary because VueFinder depends on browser-only APIs (Uppy, File, Blob, etc.)
 * and cannot be used during SSR.
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Only registers the VueFinder plugin
 * - Separation of Concerns: Client-side only, no server contamination
 */

import VueFinder from 'vuefinder'
import 'vuefinder/dist/style.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueFinder)
})
