<template>
  <v-navigation-drawer v-if="authenticated" rail permanent expand-on-hover>
    <v-list>
      <v-list-item :title="email" :subtitle="quota">
        <template v-slot:prepend>
          <v-avatar color="red">
            <span>{{ email?.[0]?.toUpperCase() ?? "?" }}</span>
          </v-avatar>
        </template>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list :lines="false" density="compact" nav>
      <v-list-item
        v-for="(item, i) in items"
        :key="i"
        :value="item"
        color="primary"
      >
        <template v-slot:prepend>
          <v-icon :icon="item.icon"></v-icon>
        </template>

        <v-list-item-title v-text="item.text"></v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import prettyBytes from "pretty-bytes";
import GeneralService from "~/services/general.service";
import { useAuth } from "~/store/auth";

const { data: userInfo, error, refresh } = await GeneralService.getUserInfo();
const { authenticated } = useAuth();

const items = [
  { text: "My Files", icon: "mdi-folder" },
  { text: "Shared with me", icon: "mdi-account-multiple" },
  { text: "Starred", icon: "mdi-star" },
  { text: "Recent", icon: "mdi-history" },
  { text: "Offline", icon: "mdi-check-circle" },
  { text: "Uploads", icon: "mdi-upload" },
  { text: "Backups", icon: "mdi-cloud-upload" },
];

const email = computed(() => userInfo.value?.email ?? "");
const quota = computed((): string => {
  if (userInfo.value) {
    return `${prettyBytes(userInfo.value.usedquota)} out of ${prettyBytes(
      userInfo.value.quota
    )} used`;
  }
  return "";
});

watchEffect(async () => {
  if (authenticated) {
    refresh()
  }
});
</script>
