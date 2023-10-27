import {
  CreateSecretRemainderParams,
  DeleteSecretRemainderParams,
  UpdateSecretRemainderParams
} from "../interfaces/services/SecretRemainderService";
import { Membership, Secret } from "../models";
import { getFolderIdFromServiceToken } from "../services/FolderService";
import { SecretNotFoundError } from "../utils/errors";
import { generateSecretBlindIndexWithSaltHelper, getSecretBlindIndexSaltHelper } from "./secrets";
import { EventType, SecretVersion } from "../ee/models";
import { EEAuditLogService, EELogService, EESecretService } from "../ee/services";
import { getAuthDataPayloadIdObj } from "../utils/auth";
import { ACTION_UPDATE_SECRETS } from "../variables";
import { TelemetryService } from "../services";
import { Types } from "mongoose";
import { AuthData } from "../interfaces/middleware";
import {
  addToSecretRemainderQueue,
  deleteFromSecretRemainderQueue
} from "../queues/secret-remainder/secretRemainderQueue";

type BaseParams = {
  workspaceId: Types.ObjectId;
  secretName: string;
  environment: string;
  secretPath: string;
  authData: AuthData;
};

type CreateParams = {
  action: "create";
  secretRemainder: {
    cron: string;
    note: string;
  };
};

type UpdateParams = {
  action: "update";
  secretRemainder: {
    cron?: string;
    note?: string;
  };
};

type DeleteParams = {
  action: "delete";
  secretRemainder?: never;
};

type updateSecretRemainderParams = BaseParams & (DeleteParams | CreateParams | UpdateParams);

async function updateSecretRemainder({
  authData,
  environment,
  secretName,
  secretPath,
  workspaceId,
  secretRemainder,
  action: updateAction
}: updateSecretRemainderParams) {
  const salt = await getSecretBlindIndexSaltHelper({
    workspaceId
  });

  const secretBlindIndex = await generateSecretBlindIndexWithSaltHelper({
    secretName,
    salt
  });

  const folderId = await getFolderIdFromServiceToken(workspaceId, environment, secretPath);

  if (updateAction === "delete" || updateAction === "update") {
    const prevSecret = await Secret.findOne({
      folder: folderId,
      workspace: workspaceId,
      environment,
      secretBlindIndex
    });

    if (!prevSecret) throw SecretNotFoundError();

    if (prevSecret.secretRemainder?.cron) {
      await deleteFromSecretRemainderQueue(
        prevSecret._id.toString(),
        prevSecret.secretRemainder.cron
      );
    }
  }

  const secret = await Secret.findOneAndUpdate(
    {
      folder: folderId,
      workspace: workspaceId,
      environment,
      secretBlindIndex
    },
    {
      ...(updateAction === "create" && { secretRemainder }),
      ...(updateAction === "delete" && { $unset: { secretRemainder: 1 } }),
      ...(updateAction === "update" && {
        $set: {
          ...(secretRemainder.cron && { "secretRemainder.cron": secretRemainder.cron }),
          ...(secretRemainder.note && { "secretRemainder.note": secretRemainder.note })
        }
      }),
      $inc: { version: 1 }
    },
    {
      new: true
    }
  );

  if (!secret) throw SecretNotFoundError();

  if (updateAction === "create" || updateAction === "update") {
    //TODO: add permission validation
    const users = await Membership.find({
      workspace: workspaceId
    }).populate("user");

    await addToSecretRemainderQueue({
      id: secret._id.toString(),
      cron: secret.secretRemainder?.cron as string,
      note: secret.secretRemainder?.note as string,
      mailsToSend: users.map((item) => item.user.email),
      secretName
    });
  }

  const secretVersion = new SecretVersion({
    secret: secret._id,
    version: secret.version,
    workspace: secret.workspace,
    folder: folderId,
    type: secret.type,
    tags: secret.tags,
    environment: secret.environment,
    isDeleted: false,
    secretBlindIndex: secret.secretBlindIndex,
    secretKeyCiphertext: secret.secretKeyCiphertext,
    secretKeyIV: secret.secretKeyIV,
    secretKeyTag: secret.secretKeyTag,
    secretValueCiphertext: secret.secretValueCiphertext,
    secretValueIV: secret.secretValueIV,
    secretValueTag: secret.secretValueTag,
    skipMultilineEncoding: secret.skipMultilineEncoding,
    algorithm: secret.algorithm,
    keyEncoding: secret.keyEncoding,
    secretRemainder: secret.secretRemainder
  });

  // (EE) add version for new secret
  await EESecretService.addSecretVersions({
    secretVersions: [secretVersion]
  });

  // (EE) create (audit) log
  const action = await EELogService.createAction({
    name: ACTION_UPDATE_SECRETS,
    ...getAuthDataPayloadIdObj(authData),
    workspaceId: workspaceId,
    secretIds: [secret._id]
  });

  action &&
    (await EELogService.createLog({
      ...getAuthDataPayloadIdObj(authData),
      workspaceId,
      actions: [action],
      channel: authData.userAgentType,
      ipAddress: authData.ipAddress
    }));

  await EEAuditLogService.createAuditLog(
    authData,
    {
      type: EventType.UPDATE_SECRET,
      metadata: {
        environment,
        secretPath,
        secretId: secret._id.toString(),
        secretKey: secretName,
        secretVersion: secret.version
      }
    },
    {
      workspaceId
    }
  );

  // (EE) take a secret snapshot
  await EESecretService.takeSecretSnapshot({
    workspaceId,
    environment,
    folderId
  });

  const postHogClient = await TelemetryService.getPostHogClient();

  if (postHogClient) {
    postHogClient.capture({
      event: "secrets modified",
      distinctId: await TelemetryService.getDistinctId({
        authData
      }),
      properties: {
        numberOfSecrets: 1,
        environment,
        workspaceId,
        folderId,
        channel: authData.userAgentType,
        userAgent: authData.userAgent
      }
    });
  }

  return secret;
}

export const createSecretRemainderHelper = async (params: CreateSecretRemainderParams) => {
  return await updateSecretRemainder({ action: "create", ...params });
};

export const deleteSecretRemainderHelper = async (params: DeleteSecretRemainderParams) => {
  return await updateSecretRemainder({ action: "delete", ...params });
};

export const updateSecretRemainderHelper = async (params: UpdateSecretRemainderParams) => {
  return await updateSecretRemainder({ action: "update", ...params });
};
