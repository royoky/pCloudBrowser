import { useAuth } from "~/store/auth";
import { ApiResultCode, UserInfo } from "~/models/api-return-types";

export default class GeneralService {
  public static async getUserInfo() {
    const params = {
      access_token: useAuth().token,
    };
    const res = await $fetch<ApiResultCode & UserInfo>(
      `https://${useAuth().baseUrl}/userinfo`,
      {
        params,
      }
    );
    if (res.result === 0) {
      return res;
    }
    throw new Error("Cannot get user info");
  }
}
