import { H3Event } from "h3";
import { OAuthToken } from "~/services/models/api-return-types";

export default defineEventHandler(async (event: H3Event) => {
  const token = await useStorage().getItem("store:token");
  const hostname = await useStorage().getItem("store:hostname");
  return { token, hostname };
});
