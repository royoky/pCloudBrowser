import { H3Event } from "h3";
import { OAuthToken } from "~/services/models/api-return-types";

export default defineEventHandler(async (event: H3Event) => {
  try {
    await useStorage().setItem("store:hello", { hello: "world" });

    const { code, hostname } = getQuery(event);
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
      await useStorage().setItem("store:token", {
        access_token: oAuthToken.access_token,
      });
      await useStorage().setItem("store:hostname", { hostname });
      return "token is stored";
    } else {
      throw new Error("cannot get token :: " + oAuthToken.result);
    }
  } catch (error) {
    throw new Error("cannot store token :: " + error);
  }
});
