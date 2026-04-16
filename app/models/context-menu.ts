export interface ContextMenuItem {
  value: ContextMenuAction
  text: string
  disabled?: boolean
}

export type ContextMenuAction
  = | 'DELETE_FOLDER'
    | 'COPY_FOLDER'
    | 'MOVE_FOLDER'
    | 'DELETE_FILE'
    | 'COPY_FILE'
    | 'MOVE_FILE'

export interface ContextMenuOperationResult {
  success: boolean
  message?: string
  error?: Error
}

export interface ContextMenuOperationHandler {
  handleOperation: (
    action: ContextMenuAction,
    itemId: string,
    options?: Record<string, unknown>,
  ) => Promise<ContextMenuOperationResult>
}

export const FOLDER_MENU_ITEMS: ContextMenuItem[] = [
  { value: 'DELETE_FOLDER', text: 'Delete folder' },
  { value: 'COPY_FOLDER', text: 'Copy folder' },
  { value: 'MOVE_FOLDER', text: 'Move folder' },
]

export const FILE_MENU_ITEMS: ContextMenuItem[] = [
  { value: 'DELETE_FILE', text: 'Delete file' },
  { value: 'COPY_FILE', text: 'Copy file' },
  { value: 'MOVE_FILE', text: 'Move file' },
]
