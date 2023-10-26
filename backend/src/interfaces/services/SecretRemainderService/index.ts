import { AuthData } from "../../middleware";
import { Types } from "mongoose";

export interface CreateSecretRemainderParams {
  secretPath: string;
  workspaceId: Types.ObjectId;
  environment: string;
  secretRemainder: {
    cron: string;
    note: string;
  };
  secretName: string;
  authData: AuthData;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeleteSecretRemainderParams
  extends Omit<CreateSecretRemainderParams, "secretRemainder"> {}
