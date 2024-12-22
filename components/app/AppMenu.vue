<script setup lang="ts">
import prettyBytes from 'pretty-bytes'
import { useAuth } from '~/store/auth'

const { useUserInfo } = useGeneral()

const { data: userInfo, refresh } = await useUserInfo()
const { authenticated } = storeToRefs(useAuth())
const { logout } = (useAuth())

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

const rail = useState<boolean>('rail', () => false)
const isDrawerOpen = useState<boolean>('drawer', () => true)

const isExpanded = ref<boolean>(!rail.value)

const router = useRouter()

async function logUserOut() {
  logout()
  router.push('/')
}

function handleRail(isRail: boolean) {
  setTimeout(() => {
    isExpanded.value = !isRail
  }, 250)
}

watchEffect(async () => {
  if (authenticated.value)
    refresh()
})
</script>

<template>
  <VNavigationDrawer
    v-if="authenticated"
    v-model="isDrawerOpen"
    :rail
    permanent
    expand-on-hover
    @update:rail="handleRail"
  >
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
    <VDivider />
    <div class="pa-2">
      <v-btn block @click="logUserOut">
        <VIcon icon="mdi-logout" :start="!rail || isExpanded" />
        <Transition>
          <p v-if="!rail || isExpanded">
            Logout
          </p>
        </Transition>
      </v-btn>
    </div>
  </VNavigationDrawer>
</template>
