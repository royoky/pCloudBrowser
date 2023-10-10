import { DateTime } from "luxon";

export interface ApiResultCode {
  result: number;
  error?: string;
}

export interface OAuthToken extends ApiResultCode {
  userid: number;
  locationid: number;
  token_type: string;
  access_token: string;
}

export interface ListFolderData extends ApiResultCode {
  metadata: PCloudFolder;
}

export type PCloudCommonMetadata = {
  path: string;
  name: string;
  isfolder: boolean;
  id: number;
  ismine: boolean;
  created: string;
  modified: string;
  thumb: boolean;
  isshared: boolean;
  icon: string;
};

export interface PCloudFolder extends PCloudCommonMetadata {
  comments: number;
  folderid: number;
  contents: [];
}

export interface PCloudCreateFolderMetadata extends PCloudCommonMetadata {
  folderid: number;
}

export interface PCloudFile extends PCloudCommonMetadata {
  contenttype: string;
  parentfolderid: number;
  hash: number;
  category: number;
  fileid: number;
  size: number;
}

export class UserInfo {
  constructor(
    public email: string,
    public emailverified: boolean,
    public registered: DateTime,
    public premium: boolean,
    public premiumexpires: DateTime,
    public quota: number,
    public usedquota: number,
    public language: string
  ) {}
}
