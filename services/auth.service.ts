import { OAuthToken } from "./models/api-return-types";
import { useAuth } from "~~/store/auth";

export default class AuthService {
  static async getAuthOptions() {
    const authUrl = "https://my.pcloud.com/oauth2/authorize";

    const client_id = import.meta.env.VITE_CLIENT_ID;

    const client_secret = import.meta.env.VITE_CLIENT_SECRET;
    debugger;
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
    const { data, pending, error, refresh } = await useFetch<OAuthToken>(
      `https://${hostname}/oauth2_token`,
      {
        key: "oauth2_token",
        server: false,
        params: {
          client_id: import.meta.env.VITE_CLIENT_ID,
          client_secret: import.meta.env.VITE_CLIENT_SECRET,
          code,
        },

        /* onRequest({ request, options }) {
          console.log("Set the request headers");
          options.headers = options.headers || {};
        },
        onRequestError({ request, options, error }) {
          console.log("Handle the request errors");
        },
        onResponse({ request, response, options }) {
          console.log("Process the response data");
          return response._data;
        },
        onResponseError({ request, response, options }) {
          console.log("Handle the response errors");
        }, */
      }
    );
    if (data.value?.result === 0) {
      console.info();
      return data.value;
    } else {
      throw new Error("cannot get token :: " + data.value?.error);
    }
  }

  static async getMe() {
    const { data: user } = await useFetch(
      `https://${useAuth().baseUrl}/userinfo`
    );
    return user;
  }

  static checkLocalStorage() {
    const token = localStorage.getItem("token");
    if (token) {
      useAuth().token = token;
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
