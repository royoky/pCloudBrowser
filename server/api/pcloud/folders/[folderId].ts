import { H3Event } from "h3";
import { z } from "zod";

const createFolderBodySchema = z.object({ name: z.string() });

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event);
  const folderId = event.context?.params?.folderId;
  const params = {
    folderid: folderId,
    ...query,
  };
  const baseUrl = event.context.auth.hostname;
  const headers = { authorization: `Bearer ${event.context.auth.token}` };
  let url = "",
    body;
  switch (event.method) {
    case "GET":
      url = "https://" + baseUrl + "/listfolder";
      break;
    case "POST":
      body = await readValidatedBody(event, createFolderBodySchema.parse);
      Object.assign(params, { name: body.name });
      url = "https://" + baseUrl + "/createfolder";
      break;
    case "PATCH":
      body = await readValidatedBody(event, createFolderBodySchema.parse);
      Object.assign(params, { toname: body.name });
      url = "https://" + baseUrl + "/renamefolder";
      break;
    case "DELETE":
      url = "https://" + baseUrl + "/deletefolderrecursive";
      break;
    default:
      break;
  }

  return $fetch(url, {
    params,
    headers,
  });
});
