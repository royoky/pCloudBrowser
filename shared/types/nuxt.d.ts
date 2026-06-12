import type { VueFinderDriver } from '~~/shared/types/vuefinder'

declare module '#app' {
  interface NuxtApp {
    $vueFinderDriver: VueFinderDriver
  }
}

export {}
