/* eslint-disable no-use-before-define */
import { model, Model } from 'mongoose';
import config from '../config/config';

import {
  ReferralListSchema,
  ReferralListDocument,
  ReferralListResponse,
} from '../entities/schemas/referral_list.schema';

import { LError } from '../helper/errors.handler';

class ReferralListRepository {
  private static instance: ReferralListRepository;
  private _model: Model<ReferralListDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.referral_list;
    this._model = model<ReferralListDocument>(this.collection, ReferralListSchema);
  }

  public static getInstance(): ReferralListRepository {
    if (!ReferralListRepository.instance) {
      ReferralListRepository.instance = new ReferralListRepository();
    }

    return ReferralListRepository.instance;
  }

  public async saveReferralList(customerId: string, parentCustomerId?: string): ReferralListResponse {
    try {
      const referralList = {
        customerId,
        parentCustomerId,
      };
      const mongooseModel = new this._model(referralList);
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[ReferralListRepository.saveReferralList]: unable to save referral list in database', error);
    }
  }

  public async getReferralListById(customerId: string): ReferralListResponse {
    try {
      const query = {
        customerId,
      };

      const result = await this._model.findOne(query, { _id: 0 }) as any;

      return result;
    } catch (error) {
      throw LError(`[ReferralListRepository.getReferralListById]: unable to find referral list id ${customerId} in database`, error);
    }
  }

  public async updateReferralList(parentId: string, childMobilePhone: string, level: number): ReferralListResponse {
    try {
      const parentReferralList = await this.getReferralListById(parentId);
      let update;

      if (level === 1) {
        const { firstReferralList } = parentReferralList;

        firstReferralList.push(childMobilePhone);
        update = { firstReferralList };
      } else {
        const { secondReferralList } = parentReferralList;

        secondReferralList.push(childMobilePhone);
        update = { secondReferralList };
      }

      const result = await this._model.findOneAndUpdate({ customerId: parentId }, update, {
        new: true,
      });

      return result;
    } catch (error) {
      throw LError(`[ReferralListRepository.updateReferralList]: unable to update referral list id ${parentId} in database`, error);
    }
  }
}

export default ReferralListRepository;
