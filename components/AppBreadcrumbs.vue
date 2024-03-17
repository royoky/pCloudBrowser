<script setup lang="ts">
defineProps<{
  items: (string | { title: string, to: string, disabled?: boolean })[]
}>()
</script>

<template>
  <VBreadcrumbs :items="items" />
</template>

<style></style>
