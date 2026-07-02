/**
 * VueFinder plugin — registers the component and provides the driver.
 *
 * Centralising both here keeps index.vue free of wiring concerns: it only
 * needs to bind the provided driver to the <VueFinder> prop.
 */

import VueFinder from 'vuefinder'
import { createVueFinderDriver } from '~/adapters/vuefinder'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueFinder)

  // Surface load/navigation errors (which VueFinder swallows) through the same
  // Nuxt UI toast channel that AppFileExplorer uses for @notify.
  const toast = useToast()
  const onLoadError = (message: string): void => {
    toast.add({ title: 'Error', description: message, color: 'error' })
  }

  nuxtApp.provide('vueFinderDriver', createVueFinderDriver('pcloud', { onLoadError }))
})
