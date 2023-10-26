import * as reqValidator from "../../validation/secretsRemainders";
import { Request, Response } from "express";
import { ProjectPermissionActions } from "../../ee/services/ProjectRoleService";
import { checkSecretsPermission } from "../../helpers";
import { validateRequest } from "../../helpers/validation";
import { Types } from "mongoose";
import { SecretRemainderService } from "../../services/SecretRemainderService";

/**
 * create secret remainder with name [secretName]
 * @param req
 * @param res
 */
export const createRemainder = async (req: Request, res: Response) => {
  const {
    body: { secretRemainder, environment, workspaceId, secretPath },
    params: { secretName }
  } = await validateRequest(reqValidator.CreateSecretRemainder, req);

  await checkSecretsPermission({
    authData: req.authData,
    workspaceId,
    environment,
    secretPath,
    secretAction: ProjectPermissionActions.Create
  });

  const secret = await SecretRemainderService.createSecretRemainder({
    environment,
    secretPath,
    workspaceId: new Types.ObjectId(workspaceId),
    secretRemainder,
    secretName,
    authData: req.authData
  });

  return res.status(200).send({
    secret
  });
};

export const deleteRemainder = async (req: Request, res: Response) => {
  const {
    body: { environment, workspaceId, secretPath },
    params: { secretName }
  } = await validateRequest(reqValidator.DeleteSecretRemainder, req);

  await checkSecretsPermission({
    authData: req.authData,
    workspaceId,
    environment,
    secretPath,
    secretAction: ProjectPermissionActions.Create
  });

  const secret = await SecretRemainderService.deleteSecretRemainder({
    environment,
    secretPath,
    workspaceId: new Types.ObjectId(workspaceId),
    secretName,
    authData: req.authData
  });

  return res.status(200).send({
    secret
  });
};
