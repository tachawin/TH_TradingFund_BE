/* eslint-disable no-unused-vars */

import * as mongoose from 'mongoose';

export interface APIExternalService {
  domain?: string
  serviceName: string
  createdAt?: Date
  serviceType?: string
  apiToken?: string
  publicKey?: string
}

export type APIExternalServiceResponse = Promise<APIExternalService>
export type APIExternalServiceListResponse = Promise<APIExternalService[]>
export type APIExternalServiceDocument = APIExternalService & mongoose.Document

const schema = new mongoose.Schema<APIExternalServiceDocument>(
  {
    domain: {
      type: String,
      default: '',
    },
    serviceName: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      default: '',
    },
    apiToken: {
      type: String,
      default: '',
    },
    publicKey: {
      type: String,
      default: '',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ serviceName: 1, domain: 1 });

export const APIExternalServiceSchema = schema;
