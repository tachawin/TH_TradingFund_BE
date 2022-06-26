/* eslint-disable no-use-before-define */
import { model, Model } from 'mongoose';
import config from '../config/config';

import {
  APIExternalServiceDocument,
  APIExternalServiceSchema,
  APIExternalService,
  APIExternalServiceResponse,
  APIExternalServiceListResponse,
} from '../entities/schemas/api.schema';

import { LError } from '../helper/errors.handler';

class APIExternalServiceRepository {
  private static instance: APIExternalServiceRepository;
  private _model: Model<APIExternalServiceDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.api_external_services;
    this._model = model<APIExternalServiceDocument>(this.collection, APIExternalServiceSchema);
  }

  public static getInstance(): APIExternalServiceRepository {
    if (!APIExternalServiceRepository.instance) {
      APIExternalServiceRepository.instance = new APIExternalServiceRepository();
    }

    return APIExternalServiceRepository.instance;
  }

  public async saveAPIExternalService(setting: APIExternalService): APIExternalServiceResponse {
    try {
      const mongooseModel = new this._model(setting);
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[APIExternalServiceRepository.saveAPIExternalService]: unable to save api external service in database', error);
    }
  }

  public async findAllAPIExternalService(): APIExternalServiceListResponse {
    try {
      const result = await this._model.find({}, { _id: 0 });

      return result;
    } catch (error) {
      throw LError('[APIExternalServiceRepository.findAllAPIExternalService]: unable to find all api external service in database', error);
    }
  }

  public async findAPIExternalServiceByServiceName(serviceName: string): APIExternalServiceResponse {
    try {
      const query = {
        serviceName,
      };
      const { _doc: result } = await this._model.findOne(query, { _id: 0 }) as any;

      return result;
    } catch (error) {
      throw LError('[APIExternalServiceRepository.findAPIExternalServiceByServiceName]: unable to find api external service in database', error);
    }
  }
}

export default APIExternalServiceRepository;
