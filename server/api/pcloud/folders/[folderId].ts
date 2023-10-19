import { H3Event } from "h3";
import { ListFolderData } from "~/models/api-return-types";

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event);
  const folderId = event.context?.params?.folderId;
  const params = {
    folderid: folderId,
    ...query,
  };
  const baseUrl = event.context.auth.hostname;
  const headers = { authorization: `Bearer ${event.context.auth.token}` };
  const res = await $fetch<ListFolderData>(
    "https://" + baseUrl + "/listfolder",
    {
      params,
      headers,
    }
  );
  return res;
});
