/* eslint-disable no-use-before-define */
import { model, Model } from 'mongoose';

import config from '../config/config';

import {
  TempTransactionSchema,
  TempTransactionDocument,
  TempTransactionResponse,
  TempTransaction,
} from '../entities/schemas/temp_transaction.schema';

import { LError } from '../helper/errors.handler';

class TempTransactionRepository {
  private static instance: TempTransactionRepository;
  private _model: Model<TempTransactionDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.temp_transaction;
    this._model = model<TempTransactionDocument>(this.collection, TempTransactionSchema);
  }

  public static getInstance(): TempTransactionRepository {
    if (!TempTransactionRepository.instance) {
      TempTransactionRepository.instance = new TempTransactionRepository();
    }

    return TempTransactionRepository.instance;
  }

  public async saveDepositTempTransaction(transaction: TempTransaction): TempTransactionResponse {
    const mongooseModel = new this._model(transaction);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[TempTransactionRepository.saveDepositTempTransaction]: unable to save deposit temp transaction to database', error);
    }
  }
}

export default TempTransactionRepository;
