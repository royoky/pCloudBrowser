import { useAuth } from "@/store/auth";
import { PCloudCreateFolderMetadata } from "./models/api-return-types";

export default class FolderService {
  baseUrl: string;

  constructor() {
    console.log("service instanciation");
    const authStore = useAuth();
    this.baseUrl = authStore.baseUrl;
  }

  public async create({
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
    });
    if (data.value?.result === 0) {
      return data.value;
    }
    throw new Error("cannot create folder :: " + data.value?.error);
  }
}
