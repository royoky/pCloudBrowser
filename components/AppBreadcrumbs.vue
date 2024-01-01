<template>
  <v-breadcrumbs :items="items"></v-breadcrumbs>
</template>

<script setup lang="ts">
defineProps<{
  items: (string | { title: string; to: string; disabled?: boolean })[];
}>();
</script>

<style></style>
