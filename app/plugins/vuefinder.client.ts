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
  nuxtApp.provide('vueFinderDriver', createVueFinderDriver('pcloud'))
})
