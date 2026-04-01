<script setup lang="ts">
import { ref } from 'vue'

const files = ref<File[]>([])
const isUploading = ref(false)
const uploadProgress = ref(0)
const currentFolderId = 0

async function uploadFiles() {
  if (files.value.length === 0)
    return
  isUploading.value = true

  try {
    // Loop through the files from the Vuetify component
    for (const file of files.value) {
      uploadProgress.value = 0

      // 1. Request signed upload URL from our server (metadata only!)
      const { uploadUrl, method, headers, fileId } = await $fetch('/api/pcloud/files/upload-url', {
        method: 'POST',
        body: {
          folderId: currentFolderId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          nopartial: true,
        },
      })

      // 2. Direct upload to pCloud (bypasses our server!)
      const uploadResponse = await fetch(uploadUrl, {
        method: method || 'PUT',
        headers: {
          'Content-Type': file.type,
          ...headers,
        },
        body: file, // Raw file data goes directly to pCloud!
        // Track upload progress
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          }
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${file.name}`)
      }

      // 3. Verify upload by getting file metadata
      const uploadedCloudFile = await $fetch(`/api/pcloud/files/${fileId}`, {
        method: 'GET',
      })
      // eslint-disable-next-line no-console
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
    uploadProgress.value = 0
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

    <!-- Upload progress indicator -->
    <v-progress-linear
      v-if="isUploading"
      v-model="uploadProgress"
      color="primary"
      height="6"
      class="mt-2"
      striped
    >
      <template #default="{ value }">
        <strong>{{ Math.ceil(value) }}%</strong>
      </template>
    </v-progress-linear>

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
