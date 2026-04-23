<script setup lang="ts">
import type { ContextMenuItem } from '~~/app/models/context-menu'

defineProps<{
  menuItems: ContextMenuItem[]
}>()

defineEmits<{
  onMenuClicked: [action: ContextMenuItem['value']]
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

defineExpose({
  show,
  close,
})
</script>

<template>
  <VMenu
    v-model="isOpen"
    :target="menuTarget"
    :close-on-content-click="true"
  >
    <VList>
      <VListItem
        v-for="(item, index) in menuItems"
        :key="`context-menu-item-${index}`"
        @click="$emit('onMenuClicked', item.value)"
      >
        <VListItemTitle>{{ item.text }}</VListItemTitle>
      </VListItem>
    </VList>
  </VMenu>
  <slot />
</template>
