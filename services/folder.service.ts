import { useAuth } from "@/store/auth";
import {
  ListFolderData,
  PCloudCreateFolderMetadata,
} from "./models/api-return-types";

export default class FolderService {
  public static async create({
    parentFolderId,
    name,
  }: {
    parentFolderId: number;
    name: string;
  }) {
    const { data } = useFetch<{
      result: number;
      metadata: PCloudCreateFolderMetadata;
      error?: string;
    }>(`${useAuth().baseUrl}/createfolder`, {
      params: {
        folderid: parentFolderId,
        name,
      },
      headers: {
        authorization: `bearer ${useAuth().token}`,
        "base-url": useAuth().baseUrl,
      },
    });
    if (data.value?.result === 0) {
      return data.value;
    }
    throw new Error("cannot create folder :: " + data.value?.error);
  }

  public static async listFolder(
    folderId: number,
    params?: {
      recursive?: boolean;
      showDeleted?: boolean;
      nofiles?: boolean;
      noShares?: boolean;
    }
  ): Promise<ListFolderData> {
    const { data } = await useFetch<ListFolderData>(
      "/api/pcloud/folders/" + folderId,
      {
        params,
        headers: {
          authorization: `${useAuth().token}`,
          "base-url": useAuth().baseUrl,
        },
      }
    );
    if (data.value) {
      return data.value;
    } else {
      throw new Error();
    }
  }
}
