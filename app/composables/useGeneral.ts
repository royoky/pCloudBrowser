export default function () {
  function useUserInfo() {
    return useFetch('/api/pcloud/general/user-info')
  }

  return {
    useUserInfo,
  }
}
