<script setup lang="ts">
import prettyBytes from 'pretty-bytes'
import GeneralService from '~/services/general.service'
import { useAuth } from '~/store/auth'

const { data: userInfo, refresh } = await GeneralService.getUserInfo()
const { authenticated } = useAuth()

const items = [
  { text: 'My Files', icon: 'mdi-folder', to: '/' },
  { text: 'Shared with me', icon: 'mdi-account-multiple' },
  { text: 'Starred', icon: 'mdi-star' },
  { text: 'Recent', icon: 'mdi-history' },
  { text: 'Offline', icon: 'mdi-check-circle' },
  { text: 'Uploads', icon: 'mdi-upload' },
  { text: 'Backups', icon: 'mdi-cloud-upload' },
]

const email = computed(() => userInfo.value?.email ?? '')
const quota = computed((): string => {
  if (userInfo.value) {
    return `${prettyBytes(userInfo.value.usedquota)} out of ${prettyBytes(
      userInfo.value.quota,
    )} used`
  }
  return ''
})

watchEffect(async () => {
  if (authenticated)
    refresh()
})
</script>

<template>
  <VNavigationDrawer v-if="authenticated" rail permanent expand-on-hover>
    <VList>
      <VListItem :title="email" :subtitle="quota">
        <template #prepend>
          <VAvatar color="red">
            <span>{{ email?.[0]?.toUpperCase() ?? "?" }}</span>
          </VAvatar>
        </template>
      </VListItem>
    </VList>

    <VDivider />

    <VList :lines="false" density="compact" nav>
      <VListItem
        v-for="(item, i) in items"
        :key="i"
        :value="item"
        :to="item.to"
        color="primary"
      >
        <template #prepend>
          <VIcon :icon="item.icon" />
        </template>

        <VListItemTitle>{{ item.text }}</VListItemTitle>
      </VListItem>
    </VList>
  </VNavigationDrawer>
</template>
