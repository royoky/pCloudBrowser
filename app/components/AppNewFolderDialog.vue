<script setup lang="ts">
const emit = defineEmits<{
  (e: 'create', name: string): void
}>()

const model = defineModel<boolean>()

const name = ref<string>('')

watchEffect(() => {
  if (model.value)
    name.value = ''
})

function onCreate() {
  if (name.value) {
    emit('create', name.value)
    name.value = ''
    model.value = false
  }
}
</script>

<template>
  <VDialog v-model="model" max-width="500px">
    <VCard>
      <VCardTitle>Create New Folder</VCardTitle>
      <VCardText>
        <VTextField
          v-model="name"
          label="Folder Name"
          autofocus
          @keyup.enter="onCreate"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="model = false">
          Cancel
        </VBtn>
        <VBtn color="primary" :disabled="!name" @click="onCreate">
          Create
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
