<script setup lang="ts">
import type { UploadResponse } from '~~/server/api/pcloud/files/upload.post'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'filesUploaded'): void
}>()

const files = ref<File[]>([])
const isUploading = ref(false)
const uploadProgress = ref<number>(0)
const currentFolderId = ref<number>(0)

async function uploadFiles() {
  if (files.value.length === 0)
    return
  isUploading.value = true

  try {
    for (const file of files.value) {
      uploadProgress.value = 0

      const uploadResponse = await new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/pcloud/files/upload', true)

        // Track upload progress
        xhr.upload.onprogress = (progressEvent: ProgressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            }
            catch (error) {
              console.error('Failed to parse JSON response:', error)
              reject(new Error(`Invalid JSON response: ${xhr.responseText}`))
            }
          }
          else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`))
          }
        }

        xhr.onerror = () => {
          reject(new Error('Upload failed'))
        }

        // Create & send FormData for the upload
        const formData = new FormData()
        formData.append('folderId', currentFolderId.value.toString())
        formData.append('filename', file.name)
        formData.append('contentType', file.type)
        formData.append('nopartial', 'true')
        formData.append('file', file)

        xhr.send(formData)
      })

      if (!uploadResponse || !uploadResponse.success) {
        throw new Error(`Failed to upload ${file.name}`)
      }

      console.info('Successfully uploaded:', file.name, 'File ID:', uploadResponse.fileId)
    }

    files.value = []

    emit('filesUploaded')
  }
  catch (error) {
    console.error('Upload failed:', error)
  }
  finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}
</script>

<template>
  <ClientOnly>
    <VContainer>
      <VFileUpload
        v-model="files"
        density="compact"
        title="Drag and Drop to pCloud"
        multiple
        clearable
        show-size
      />

      <!-- Upload progress indicator -->
      <VProgressLinear
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
      </VProgressLinear>

      <VBtn
        color="primary"
        class="mt-4"
        :disabled="files.length === 0 || isUploading"
        :loading="isUploading"
        @click="uploadFiles"
      >
        Upload to Cloud
      </VBtn>
    </VContainer>
  </ClientOnly>
</template>
