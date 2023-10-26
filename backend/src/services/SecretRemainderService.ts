import {
  CreateSecretRemainderParams,
  DeleteSecretRemainderParams
} from "../interfaces/services/SecretRemainderService";
import {
  createSecretRemainderHelper,
  deleteSecretRemainderHelper
} from "../helpers/secretRemainder";

export class SecretRemainderService {
  static async createSecretRemainder(params: CreateSecretRemainderParams) {
    return await createSecretRemainderHelper(params);
  }

  static async deleteSecretRemainder(params: DeleteSecretRemainderParams) {
    return await deleteSecretRemainderHelper(params);
  }
}
