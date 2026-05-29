/**
 * File System Composable
 *
 * Provides access to the file system repository and VueFinder driver.
 * This is the main entry point for file system operations in the frontend.
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Only provides file system access
 * - Lazy Initialization: Driver is created on first use
 * - Dependency Injection: Uses repository abstraction
 * - Error Handling: Consistent error handling
 */

import type { VueFinderDriver } from '~~/app/adapters/vuefinder'
import type { FileRepository } from '~~/shared/domain/ports/file.repository'
import { createPCloudVueFinderDriver } from '~~/app/adapters/vuefinder'
import { ApiFileRepository } from '~~/app/clients/api.repository'

/**
 * Singleton repository instance
 * Created lazily on first use
 */
let repositoryInstance: FileRepository | null = null

/**
 * Singleton driver instance
 * Created lazily on first use
 */
let driverInstance: VueFinderDriver | null = null

/**
 * Gets the file system repository
 * Creates it on first call, reuses it afterwards
 */
export function useFileRepository(): FileRepository {
  if (!repositoryInstance) {
    repositoryInstance = new ApiFileRepository('/api/files')
  }
  return repositoryInstance
}

/**
 * Gets the VueFinder driver
 * Creates it on first call, reuses it afterwards
 */
export function useVueFinderDriver(): VueFinderDriver {
  if (!driverInstance) {
    const repository = useFileRepository()
    driverInstance = createPCloudVueFinderDriver(repository, {
      storageName: 'pcloud',
    })
  }
  return driverInstance
}

/**
 * Resets the singleton instances
 * Useful for testing or when user logs out/in
 */
export function resetFileSystem(): void {
  repositoryInstance = null
  driverInstance = null
}

/**
 * Composable that provides reactive access to file system
 * Can be used in Vue components
 */
export function useFileSystem() {
  const repository = useFileRepository()
  const driver = useVueFinderDriver()

  return {
    repository,
    driver,
    reset: resetFileSystem,
  }
}
