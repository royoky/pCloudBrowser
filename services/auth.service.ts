import { OAuthToken, UserInfo } from "./models/api-return-types";
import { useAuth } from "~~/store/auth";
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

  static async getMe(): Promise<UserInfo> {
    const { data: userDto } = await useFetch<any, Error, string, any>(
      `https://${useAuth().baseUrl}/userinfo`,
      { params: { access_token: useAuth().token } }
    );
    const user = plainToInstance(UserInfo, userDto);
    return user;
  }

  static checkLocalStorage() {
    const token = localStorage.getItem("token");
    const baseUrl = localStorage.getItem("baseUrl");
    if (token && baseUrl) {
      useAuth().token = token;
      useAuth().baseUrl = baseUrl;
    }
  }

  static async logout(): Promise<boolean> {
    try {
      await useFetch(`https://${useAuth().baseUrl}/logout`);
    } catch (e) {
      return false;
    }
    return true;
  }
}
