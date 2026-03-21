<script setup lang="ts">
import { ref } from 'vue'

const files = ref<File[]>([])
const isUploading = ref(false)

const currentFolderId = 0

async function uploadFiles() {
  if (files.value.length === 0)
    return
  isUploading.value = true

  try {
    // 3. Loop through the files from the Vuetify component
    for (const file of files.value) {
      // 4. Construct the FormData exactly as our API expects it
      const formData = new FormData()
      formData.append('folderid', currentFolderId.toString())
      formData.append('nopartial', '1') // Highly recommended by pCloud
      formData.append('file', file)
      for (const [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value)
      }

      // 5. Send it to our shiny new Nuxt route!
      const uploadedCloudFile = await $fetch('/api/pcloud/files/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Successfully uploaded:', uploadedCloudFile.name)
    }

    // Clear the Vuetify dropzone once everything is done
    files.value = []
  }
  catch (error) {
    console.error('Upload failed:', error)
    // Handle error (e.g., show a Vuetify v-snackbar)
  }
  finally {
    isUploading.value = false
  }
}
</script>

<template>
  <v-container>
    <v-file-upload
      v-model="files"
      title="Drag and Drop to pCloud"
      multiple
      clearable
      show-size
    />

    <v-btn
      color="primary"
      class="mt-4"
      :disabled="files.length === 0 || isUploading"
      :loading="isUploading"
      @click="uploadFiles"
    >
      Upload to Cloud
    </v-btn>
  </v-container>
</template>
