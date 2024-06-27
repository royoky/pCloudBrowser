import type { UserInfo } from '~/models/api-return-types'

export default function () {
  function useUserInfo() {
    return useFetch<UserInfo>('/api/pcloud/general/userInfo')
  }

  return {
    useUserInfo,
  }
}
