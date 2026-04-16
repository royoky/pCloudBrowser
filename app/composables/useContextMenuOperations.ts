import type { ContextMenuAction, ContextMenuOperationResult } from '~~/app/models/context-menu'
import type { FileOperationOptions } from './useFileOperations'
import type { FolderOperationOptions } from './useFolderOperations'
import { ref } from 'vue'

export function useContextMenuOperations() {
  const { deleteFolder, copyFolder, moveFolder } = useFolderOperations()
  const { deleteFile, copyFile, moveFile } = useFileOperations()

  const isLoading = ref<boolean>(false)
  const error = ref<Error | null>(null)
  const lastOperationResult = ref<ContextMenuOperationResult | null>(null)

  const executeOperation = async (
    action: ContextMenuAction,
    itemId: string,
    options?: FolderOperationOptions | FileOperationOptions,
  ): Promise<ContextMenuOperationResult> => {
    try {
      switch (action) {
        case 'DELETE_FOLDER':
          return await deleteFolder(itemId)
        case 'DELETE_FILE':
          return await deleteFile(itemId)
        case 'COPY_FOLDER':
          if (!options?.targetFolderId) {
            return {
              success: false,
              message: 'Target folder ID is required for copy operation',
            }
          }
          return await copyFolder(itemId, options)
        case 'MOVE_FOLDER':
          if (!options?.targetFolderId) {
            return {
              success: false,
              message: 'Target folder ID is required for move operation',
            }
          }
          return await moveFolder(itemId, options)
        case 'COPY_FILE':
          if (!options?.targetFolderId) {
            return {
              success: false,
              message: 'Target folder ID is required for copy operation',
            }
          }
          return await copyFile(itemId, options)
        case 'MOVE_FILE':
          if (!options?.targetFolderId) {
            return {
              success: false,
              message: 'Target folder ID is required for move operation',
            }
          }
          return await moveFile(itemId, options)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    }
    catch (err) {
      console.error(`Failed to execute ${action}:`, err)
      throw err
    }
  }

  const handleOperation = async (
    action: ContextMenuAction,
    itemId: string,
    options?: FolderOperationOptions | FileOperationOptions,
  ): Promise<ContextMenuOperationResult> => {
    isLoading.value = true
    error.value = null
    lastOperationResult.value = null

    try {
      const result = await executeOperation(action, itemId, options)
      lastOperationResult.value = result
      return result
    }
    catch (err) {
      const operationError = err instanceof Error ? err : new Error('Unknown error')
      error.value = operationError
      lastOperationResult.value = {
        success: false,
        error: operationError,
        message: operationError.message,
      }
      return lastOperationResult.value
    }
    finally {
      isLoading.value = false
    }
  }

  const resetState = () => {
    isLoading.value = false
    error.value = null
    lastOperationResult.value = null
  }

  return {
    handleOperation,
    isLoading,
    error,
    lastOperationResult,
    resetState,
  }
}
