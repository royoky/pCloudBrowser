import { H3Event } from "h3";
import { ListFolderData } from "~~/services/models/api-return-types";

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event);
  const folderId = event.context?.params?.folderId;
  const params = {
    folderid: folderId,
    ...query,
  };
  const baseUrl = event.context["baseUrl"];
  const headers = { authorization: `Bearer ${event.context?.authorization}` };
  const res = await $fetch<ListFolderData>(baseUrl + "/listfolder", {
    params,
    headers,
  });
  return res;
});
