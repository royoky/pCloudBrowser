import type { OAuthToken } from '~/models/api-return-types'

export default class AuthService {
  static async getTokenFromCode(
    code: string,
  ): Promise<OAuthToken> {
    return $fetch('/api/pcloud/auth/token', { params: { code } })
  }
}
