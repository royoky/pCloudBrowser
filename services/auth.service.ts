import { OAuthToken, UserInfo } from "~/models/api-return-types";
import { useAuth } from "~/store/auth";
import { plainToInstance } from "class-transformer";

export default class AuthService {
  static async getAuthOptions() {
    const authUrl = "https://my.pcloud.com/oauth2/authorize";

    const client_id = import.meta.env.VITE_CLIENT_ID;

    const client_secret = import.meta.env.VITE_CLIENT_SECRET;
    return {
      authUrl,
      params: {
        client_id,
        client_secret,
        response_type: "code",
      },
    };
  }

  static async getTokenFromCode(
    code: string,
    hostname: string
  ): Promise<OAuthToken> {
    const oAuthToken = await $fetch<OAuthToken>(
      `https://${hostname}/oauth2_token`,
      {
        params: {
          client_id: import.meta.env.VITE_CLIENT_ID,
          client_secret: import.meta.env.VITE_CLIENT_SECRET,
          code,
        },
      }
    );
    if (oAuthToken.result === 0) {
      return oAuthToken;
    } else {
      throw new Error("cannot get token :: " + oAuthToken.result);
    }
  }

  /* static async getMe(): Promise<UserInfo> {
    const userDto = await $fetch(`https://${useAuth().baseUrl}/userinfo`);
    const user = plainToInstance(UserInfo, userDto);
    return user;
  } */
}
