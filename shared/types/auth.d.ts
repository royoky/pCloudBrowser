declare module '#auth-utils' {
  interface User {
    pcloudId: number
    email: string
    emailVerified: boolean
    registered: DateTime
    premium: boolean
    premiumexpires: DateTime
    quota: number
    usedquota: number
    language: string
  }

  interface UserSession {
    pcloudAccessToken?: string
    pcloudApiHostname?: string
  }
}

export {}
