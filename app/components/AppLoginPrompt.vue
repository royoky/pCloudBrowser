<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

const providers: ButtonProps[] = [
  {
    label: 'Login — Full access',
    icon: 'i-lucide-hard-drive',
    color: 'primary',
    variant: 'solid',
    href: '/auth/pcloud?scope=full',
    external: true,
  },
  {
    label: 'Login — App folder only',
    icon: 'i-lucide-folder-lock',
    color: 'neutral',
    variant: 'outline',
    href: '/auth/pcloud?scope=appfolder',
    external: true,
  },
]
</script>

<template>
  <div class="flex items-center justify-center w-full h-full min-h-100">
    <UAuthForm
      icon="i-lucide-cloud"
      title="pCloud Browser"
      description="Choose the access level for this session."
      :providers="providers"
      class="max-w-sm w-full"
    >
      <template #separator />
      <template #submit />
    </UAuthForm>
  </div>
</template>
