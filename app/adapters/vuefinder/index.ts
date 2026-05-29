/**
 * VueFinder Adapter Module
 *
 * Exports all VueFinder adapter components for use in the application.
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: This file only exports, doesn't implement
 * - Clear Dependencies: Explicit exports make module dependencies clear
 */

export {
  createPCloudVueFinderDriver,
  createVueFinderDriver,
  type VueFinderDriverConfig,
} from './driver'

export {
  createRootDirEntry,
  mapFileEntityToDirEntry,
  mapFileSystemItemsToFsData,
  mapFileSystemItemToDirEntry,
  mapFolderEntityToDirEntry,
  mapFolderEntityToFsData,
} from './mapper'

export type { VueFinderDriver } from '~~/shared/types/vuefinder'
