/* eslint-disable no-use-before-define */
import { model, Model } from 'mongoose';

import config from '../config/config';

import {
  CashbackHistorySchema,
  CashbackHistoryDocument,
  CashbackHistoryResponse,
  CashbackHistoryListResponse,
  CashbackHistory,
} from '../entities/schemas/cashback.history.schema';

import { LError } from '../helper/errors.handler';

class CashbackHistoryRepository {
  private static instance: CashbackHistoryRepository;
  private _model: Model<CashbackHistoryDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.cashback_customer_history;
    this._model = model<CashbackHistoryDocument>(this.collection, CashbackHistorySchema);
  }

  public static getInstance(): CashbackHistoryRepository {
    if (!CashbackHistoryRepository.instance) {
      CashbackHistoryRepository.instance = new CashbackHistoryRepository();
    }

    return CashbackHistoryRepository.instance;
  }

  public async saveCashbackHistoryFailed(transaction: CashbackHistory): CashbackHistoryResponse {
    try {
      const mongooseModel = new this._model(transaction);
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[CashbackHistoryRepository.saveCashbackHistoryFailed]: unable to save cashback history in to database', error);
    }
  }

  public async findAllCashbackCustomerHistory(username: string): CashbackHistoryListResponse {
    try {
      const query = {
        username,
      };
      const result = await this._model.find(query, { _id: 0 }).sort({ createdAt: -1 });

      return result;
    } catch (error) {
      throw LError(`[CashbackHistoryRepository.findAllCashbackCustomerHistory]: unable to find all cashback customer history, username:${username}`, error);
    }
  }
}

export default CashbackHistoryRepository;
