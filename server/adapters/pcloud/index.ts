/**
 * pCloud Adapter Module
 *
 * Exports all pCloud adapter components for use in the application.
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: This file only exports, doesn't implement
 * - Clear Dependencies: Explicit exports make module dependencies clear
 */

export { PCloudApiError, PCloudClient } from './client'
export type { PCloudClientConfig } from './client'
export {
  createPCloudRepository,
  PCloudFileRepository,
} from './repository'
export type { PCloudRepositoryConfig } from './repository'
