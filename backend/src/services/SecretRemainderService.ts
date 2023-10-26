import {
  CreateSecretRemainderParams,
  DeleteSecretRemainderParams,
  UpdateSecretRemainderParams
} from "../interfaces/services/SecretRemainderService";
import {
  createSecretRemainderHelper,
  deleteSecretRemainderHelper,
  updateSecretRemainderHelper
} from "../helpers/secretRemainder";

export class SecretRemainderService {
  static async createSecretRemainder(params: CreateSecretRemainderParams) {
    return await createSecretRemainderHelper(params);
  }

  static async deleteSecretRemainder(params: DeleteSecretRemainderParams) {
    return await deleteSecretRemainderHelper(params);
  }

  static async updateSecretRemainder(params: UpdateSecretRemainderParams) {
    return await updateSecretRemainderHelper(params);
  }
}
