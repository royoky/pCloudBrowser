<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, clear, accessModeLabel, quota } = usePCloudAccount()

const items = computed<DropdownMenuItem[][]>(() => [[
  {
    label: 'Logout',
    icon: 'i-lucide-log-out',
    color: 'error' as const,
    onSelect: () => clear(),
  },
]])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', sideOffset: 8 }"
    :ui="{ content: 'w-64' }"
  >
    <UButton color="neutral" variant="ghost" size="sm" class="rounded-full p-0.5">
      <UAvatar :alt="user?.email" size="sm" />
    </UButton>

    <template #content-top>
      <div class="px-3 py-2.5 space-y-2.5">
        <div>
          <p class="text-sm font-medium text-highlighted truncate">
            {{ user?.email }}
          </p>
          <p class="text-xs text-muted mt-0.5">
            {{ accessModeLabel }}
          </p>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-xs text-muted gap-2">
            <span class="shrink-0">Storage</span>
            <span class="tabular-nums">{{ quota.used }} / {{ quota.total }}</span>
          </div>
          <UProgress :model-value="quota.percent" :color="quota.color" size="xs" />
        </div>
      </div>
      <USeparator />
    </template>
  </UDropdownMenu>
</template>
