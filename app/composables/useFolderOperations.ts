import type { ContextMenuOperationResult } from '~~/app/models/context-menu'

export interface FolderOperationOptions {
  targetFolderId?: string
  newName?: string
  allowOverwrite?: boolean
}

export function useFolderOperations() {
  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error instanceof Error) {
      return error.message || defaultMessage
    }
    if (typeof error === 'string') {
      return error
    }
    return defaultMessage
  }

  const deleteFolder = async (folderId: string): Promise<ContextMenuOperationResult> => {
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

  const copyFolder = async (
    folderId: string,
    options: FolderOperationOptions,
  ): Promise<ContextMenuOperationResult> => {
    try {
      const { targetFolderId, newName, allowOverwrite } = options

      await $fetch<any>(`/api/pcloud/folders/${folderId}/copy`, {
        method: 'POST',
        body: {
          targetFolderId,
          newName,
          allowOverwrite,
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

  const moveFolder = async (
    folderId: string,
    options: FolderOperationOptions,
  ): Promise<ContextMenuOperationResult> => {
    try {
      const { targetFolderId, newName } = options

      await $fetch<any>(`/api/pcloud/folders/${folderId}`, {
        method: 'PUT',
        body: {
          targetFolderId,
          newName,
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

  return {
    deleteFolder,
    copyFolder,
    moveFolder,
  }
}
