import type { ContextMenuAction, ContextMenuOperationResult } from '~~/app/models/context-menu'
import { ref } from 'vue'

export function createContextMenuOperations() {
  const isLoading = ref<boolean>(false)
  const error = ref<Error | null>(null)
  const lastOperationResult = ref<ContextMenuOperationResult | null>(null)

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error instanceof Error) {
      return error.message || defaultMessage
    }
    if (typeof error === 'string') {
      return error
    }
    return defaultMessage
  }

  const handleDeleteFolder = async (folderId: string): Promise<ContextMenuOperationResult> => {
    try {
      const response = await $fetch<{ success: boolean, deletedCount: number }>(
        `/api/pcloud/folders/${folderId}`,
        { method: 'DELETE' },
      )

      if (response.success) {
        return {
          success: true,
          message: `Deleted ${response.deletedCount} items`,
        }
      }

      throw new Error('Folder deletion failed')
    }
    catch (error) {
      console.error('Folder deletion error:', error)
      throw new Error(getErrorMessage(error, 'Failed to delete folder'))
    }
  }

  const handleCopyFolder = async (
    folderId: string,
    destinationFolderId: string,
    newName?: string,
  ): Promise<ContextMenuOperationResult> => {
    try {
      await $fetch<any>(`/api/pcloud/folders/${folderId}/copy`, {
        method: 'POST',
        body: {
          tofolderid: Number(destinationFolderId),
          toname: newName,
        },
      })

      return {
        success: true,
        message: 'Folder copied successfully',
      }
    }
    catch (error) {
      console.error('Folder copy error:', error)
      throw new Error(getErrorMessage(error, 'Failed to copy folder'))
    }
  }

  const handleMoveFolder = async (
    folderId: string,
    destinationFolderId: string,
    newName?: string,
  ): Promise<ContextMenuOperationResult> => {
    try {
      await $fetch<any>(`/api/pcloud/folders/${folderId}`, {
        method: 'PUT',
        body: {
          name: newName,
        },
      })

      return {
        success: true,
        message: 'Folder moved successfully',
      }
    }
    catch (error) {
      console.error('Folder move error:', error)
      throw new Error(getErrorMessage(error, 'Failed to move folder'))
    }
  }

  const handleDeleteFile = async (fileId: string): Promise<ContextMenuOperationResult> => {
    try {
      const response = await $fetch<{ success: boolean }>(`/api/pcloud/files/${fileId}`, {
        method: 'DELETE',
      })

      if (response.success) {
        return {
          success: true,
          message: 'File deleted successfully',
        }
      }

      throw new Error('File deletion failed')
    }
    catch (error) {
      console.error('File deletion error:', error)
      throw new Error(getErrorMessage(error, 'Failed to delete file'))
    }
  }

  const executeOperation = async (
    action: ContextMenuAction,
    itemId: string,
    options?: Record<string, unknown>,
  ): Promise<ContextMenuOperationResult> => {
    try {
      switch (action) {
        case 'DELETE_FOLDER':
          return await handleDeleteFolder(itemId)
        case 'DELETE_FILE':
          return await handleDeleteFile(itemId)
        case 'COPY_FOLDER':
          if (!options?.destinationFolderId) {
            return {
              success: false,
              message: 'Destination folder ID is required for copy operation',
            }
          }
          return await handleCopyFolder(
            itemId,
            options.destinationFolderId as string,
            options.newName as string | undefined,
          )
        case 'MOVE_FOLDER':
          if (!options?.destinationFolderId) {
            return {
              success: false,
              message: 'Destination folder ID is required for move operation',
            }
          }
          return await handleMoveFolder(
            itemId,
            options.destinationFolderId as string,
            options.newName as string | undefined,
          )
        case 'COPY_FILE':
        case 'MOVE_FILE':
          return {
            success: false,
            message: 'Operation not yet implemented',
          }
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    }
    catch (error) {
      console.error(`Failed to execute ${action}:`, error)
      throw new Error(getErrorMessage(error, `Failed to execute ${action}`))
    }
  }

  const handleOperation = async (
    action: ContextMenuAction,
    itemId: string,
    options?: Record<string, unknown>,
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
