import type { UserInfo } from "~/models/api-return-types";

export default class GeneralService {
  public static async getUserInfo() {
    return useFetch<UserInfo>("/api/pcloud/general/userInfo")
  }
}
