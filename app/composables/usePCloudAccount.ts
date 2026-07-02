import prettyBytes from 'pretty-bytes'

export function usePCloudAccount() {
  const { loggedIn, user, session, clear } = useUserSession()

  const accessModeLabel = computed(() =>
    session.value?.pcloudAccessMode === 'appfolder' ? 'App folder' : 'Full access',
  )

  const quota = computed(() => {
    const total = user.value?.quota ?? 0
    const used = user.value?.usedquota ?? 0
    const percent = total > 0 ? Math.round((used / total) * 100) : 0
    let color: 'error' | 'warning' | 'primary' = 'primary'
    if (percent > 90) {
      color = 'error'
    }
    else if (percent > 70) {
      color = 'warning'
    }
    return {
      used: prettyBytes(used),
      total: prettyBytes(total),
      percent,
      color,
    } as const
  })

  return { loggedIn, user, clear, accessModeLabel, quota }
}
