import { AuthData } from "../../middleware";
import { Types } from "mongoose";

interface BaseParams {
  secretPath: string;
  workspaceId: Types.ObjectId;
  environment: string;
  secretName: string;
  authData: AuthData;
}

export interface CreateSecretRemainderParams extends BaseParams {
  secretRemainder: {
    cron: string;
    note: string;
  };
}

export type DeleteSecretRemainderParams = BaseParams;

export interface UpdateSecretRemainderParams extends BaseParams {
  secretRemainder: {
    cron?: string;
    note?: string;
  };
}
