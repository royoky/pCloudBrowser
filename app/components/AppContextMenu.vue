<script setup lang="ts">
import type { ContextMenuItem } from '~~/app/models/context-menu'

defineProps<{
  menuItems: ContextMenuItem[]
}>()

defineEmits<{
  onMenuClicked: [action: ContextMenuItem['value']]
}>()

const isOpen = defineModel({ type: Boolean })
const menuCoordinates = ref<[number, number]>()
const { x, y } = useMouse()
const { y: scrollY } = useWindowScroll()

function show() {
  isOpen.value = false
  menuCoordinates.value = [x.value, y.value - scrollY.value]
  nextTick(() => {
    isOpen.value = true
  })
}

defineExpose({
  show,
})
</script>

<template>
  <Teleport to="body">
    <VMenu v-model="isOpen" :target="menuCoordinates">
      <VList>
        <VListItem
          v-for="(item, index) in menuItems"
          :key="index"
          :value="index"
          @click="$emit('onMenuClicked', item.value)"
        >
          <VListItemTitle>{{ item.text }}</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </Teleport>
  <slot />
</template>
