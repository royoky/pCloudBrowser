<template>
  <v-navigation-drawer
    v-if="authStore.isAuthenticated"
    rail
    permanent
    expand-on-hover
  >
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

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-folder"
        title="My Files"
        value="myfiles"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-multiple"
        title="Shared with me"
        value="shared"
      >
      </v-list-item>
      <v-list-item
        prepend-icon="mdi-star"
        title="Starred"
        value="starred"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import prettyBytes from "pretty-bytes";
import GeneralService from "~~/services/general.service";
import { UserInfo } from "~~/services/models/api-return-types";
import { useAuth } from "~~/store/auth";

const authStore = useAuth();
const userInfo = ref<UserInfo>();

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
  if (authStore.isAuthenticated) {
    userInfo.value = await GeneralService.getUserInfo();
  } else {
    userInfo.value = undefined;
  }
});
</script>
