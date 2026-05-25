<script setup lang="ts">
import type { ContextMenuAction, ContextMenuItem } from '~~/app/models/context-menu'
import type { MiniCloudFolder } from '~~/shared/models/cloud-item'

interface Props {
  menuItems: ContextMenuItem[]
  folders: MiniCloudFolder[]
  sourceFolderId?: string | null
}

const { menuItems, folders, sourceFolderId } = defineProps<Props>()

const emit = defineEmits<{
  onMenuClicked: [action: ContextMenuAction, targetFolder?: MiniCloudFolder]
}>()

const isOpen = defineModel<boolean>()
const initialX = ref<number>(0)
const initialY = ref<number>(0)

const { y: scrollY } = useWindowScroll()

const menuTarget = computed<[number, number]>(() => [
  initialX.value,
  initialY.value - scrollY.value,
])

async function show(x: number, y: number) {
  if (isOpen.value) {
    isOpen.value = false
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  initialX.value = x
  initialY.value = y
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function getIcon(action: ContextMenuAction): string {
  switch (action) {
    case 'DELETE_FOLDER':
    case 'DELETE_FILE':
      return 'mdi-delete'
    case 'COPY_FOLDER':
    case 'COPY_FILE':
      return 'mdi-content-copy'
    case 'MOVE_FOLDER':
    case 'MOVE_FILE':
      return 'mdi-folder-move'
    default:
      return ''
  }
}

function isCopyOrMoveAction(action: ContextMenuAction): boolean {
  return (
    action === 'COPY_FOLDER'
    || action === 'COPY_FILE'
    || action === 'MOVE_FOLDER'
    || action === 'MOVE_FILE'
  )
}

function handleClick(item: ContextMenuItem) {
  if (!isCopyOrMoveAction(item.value)) {
    emit('onMenuClicked', item.value)
    close()
  }
}

defineExpose({
  show,
  close,
})
</script>

<template>
  <VMenu v-model="isOpen" :target="menuTarget" :close-on-content-click="false">
    <VList density="compact">
      <VListItem
        v-for="item in menuItems"
        :key="`menu-item-${item.value}`"
        @click="handleClick(item)"
      >
        <template #prepend>
          <VIcon v-if="getIcon(item.value)" :icon="getIcon(item.value)" />
        </template>
        <VListItemTitle>{{ item.text }}</VListItemTitle>

        <template v-if="isCopyOrMoveAction(item.value)" #append>
          <VIcon icon="mdi-menu-right" size="x-small" />
        </template>

        <!-- Folder picker sub-menu for copy/move actions -->
        <VMenu
          v-if="isCopyOrMoveAction(item.value)"
          activator="parent"
          :open-on-focus="false"
          open-on-hover
          submenu
          close-on-content-click
          eager
        >
          <VList density="compact">
            <AppFolderPickerMenu
              :folders="folders"
              :action="item.value as ContextMenuAction"
              :source-folder-id="sourceFolderId"
              :parent-id="null"
              @on-folder-selected="
                (folder) => emit('onMenuClicked', item.value as ContextMenuAction, folder)
              "
            />
          </VList>
        </VMenu>
      </VListItem>
    </VList>
  </VMenu>
  <slot />
</template>
