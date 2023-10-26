import {
  CreateSecretRemainderParams,
  DeleteSecretRemainderParams
} from "../interfaces/services/SecretRemainderService";
import { Secret } from "../models";
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

interface updateSecretRemainderParams {
  workspaceId: Types.ObjectId;
  secretName: string;
  environment: string;
  secretPath: string;
  authData: AuthData;
  secretRemainder?: {
    cron: string;
    note: string;
  };
}

async function updateSecretRemainder({
  authData,
  environment,
  secretName,
  secretPath,
  workspaceId,
  secretRemainder
}: updateSecretRemainderParams) {
  const salt = await getSecretBlindIndexSaltHelper({
    workspaceId
  });

  const secretBlindIndex = await generateSecretBlindIndexWithSaltHelper({
    secretName,
    salt
  });

  const folderId = await getFolderIdFromServiceToken(workspaceId, environment, secretPath);

  let secret = await Secret.findOne(
    {
      folder: folderId,
      workspace: workspaceId,
      environment,
      secretBlindIndex
    },
    {
      ...(secretRemainder ? { secretRemainder } : { $unset: { secretRemainder: 1 } }),
      $inc: { version: 1 }
    },
    {
      new: true
    }
  );

  if (!secret) throw SecretNotFoundError();

  secret = await Secret.findOneAndUpdate(
    {
      folder: folderId,
      workspace: workspaceId,
      environment,
      secretBlindIndex
    },
    {
      ...(secretRemainder ? { secretRemainder } : { $unset: { secretRemainder: 1 } }),
      $inc: { version: 1 }
    },
    {
      new: true
    }
  );

  if (!secret) throw SecretNotFoundError();

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
  return await updateSecretRemainder(params);
};

export const deleteSecretRemainderHelper = async (params: DeleteSecretRemainderParams) => {
  return await updateSecretRemainder(params);
};
