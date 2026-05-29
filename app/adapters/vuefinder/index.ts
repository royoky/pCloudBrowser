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
  createVueFinderDriver,
  createPCloudVueFinderDriver,
  type VueFinderDriverConfig,
  type PCloudVueFinderDriverConfig,
} from './driver';

export {
  mapFileEntityToDirEntry,
  mapFolderEntityToDirEntry,
  mapFileSystemItemToDirEntry,
  mapFolderEntityToFsData,
  mapFileSystemItemsToFsData,
  createRootDirEntry,
} from './mapper';
