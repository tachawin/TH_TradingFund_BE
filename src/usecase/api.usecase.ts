import { APIExternalService } from '../entities/schemas/api.schema';
import { encryptWebhookTransaction } from '../helper/crypto.handler';

import { LError } from '../helper/errors.handler';

import APIExternalServiceRepository from '../repositories/api.repository';

const apiRepo = APIExternalServiceRepository.getInstance();

async function registerExternalService(info: APIExternalService): Promise<string> {
  try {
    const key = encryptWebhookTransaction(info.domain);

    await apiRepo.saveAPIExternalService({ ...info, publicKey: key });

    return key;
  } catch (error) {
    throw LError('[APIExternalServiceUsecase.registerExternalService]: unable to add api external service to our system', error);
  }
}

export default {
  registerExternalService,
};
