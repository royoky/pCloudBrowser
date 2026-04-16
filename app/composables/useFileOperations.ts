import type { ContextMenuOperationResult } from '~~/app/models/context-menu'

export interface FileOperationOptions {
  targetFolderId?: string
  newName?: string
  allowOverwrite?: boolean
}

export function useFileOperations() {
  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error instanceof Error) {
      return error.message || defaultMessage
    }
    if (typeof error === 'string') {
      return error
    }
    return defaultMessage
  }

  const deleteFile = async (fileId: string): Promise<ContextMenuOperationResult> => {
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

  const copyFile = async (
    fileId: string,
    options: FileOperationOptions,
  ): Promise<ContextMenuOperationResult> => {
    try {
      const { targetFolderId, newName, preventOverwrite } = options

      await $fetch<any>(`/api/pcloud/files/${fileId}/copy`, {
        method: 'POST',
        body: {
          targetFolderId,
          newName,
          allowOverwrite,
        },
      })

      return {
        success: true,
        message: 'File copied successfully',
      }
    }
    catch (error) {
      console.error('File copy error:', error)
      throw new Error(getErrorMessage(error, 'Failed to copy file'))
    }
  }

  const moveFile = async (
    fileId: string,
    options: FileOperationOptions,
  ): Promise<ContextMenuOperationResult> => {
    try {
      const { targetFolderId, newName } = options

      await $fetch<any>(`/api/pcloud/files/${fileId}`, {
        method: 'PATCH',
        body: {
          targetFolderId,
          newName,
        },
      })

      return {
        success: true,
        message: 'File moved successfully',
      }
    }
    catch (error) {
      console.error('File move error:', error)
      throw new Error(getErrorMessage(error, 'Failed to move file'))
    }
  }

  return {
    deleteFile,
    copyFile,
    moveFile,
  }
}
