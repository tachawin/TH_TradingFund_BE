/* eslint-disable no-use-before-define */
import { model, Model } from 'mongoose';
import config from '../config/config';

import {
  ReferralPercentageBodyRequest,
} from '../entities/dtos/setting.dtos';

import {
  SystemSetting,
  SystemSettingSchema,
  SystemSettingDocument,
  SystemSettingResponse,
  SystemSettingListResponse,
  SystemSettingTypeConstant,
} from '../entities/schemas/setting.schema';

import { LError } from '../helper/errors.handler';

class SystemSettingRepository {
  private static instance: SystemSettingRepository;
  private _model: Model<SystemSettingDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.system_setting;
    this._model = model<SystemSettingDocument>(this.collection, SystemSettingSchema);
  }

  public static getInstance(): SystemSettingRepository {
    if (!SystemSettingRepository.instance) {
      SystemSettingRepository.instance = new SystemSettingRepository();
    }

    return SystemSettingRepository.instance;
  }

  public async saveSystemSetting(setting: SystemSetting): SystemSettingResponse {
    try {
      const mongooseModel = new this._model(setting);
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[SystemSettingRepository.saveSystemSetting]: unable to save system setting in database', error);
    }
  }

  public async findAllSystemSetting(): SystemSettingListResponse {
    try {
      const result = await this._model.find({}, { _id: 0 });

      return result;
    } catch (error) {
      throw LError('[SystemSettingRepository.findAllSystemSetting]: unable to find all system setting in database', error);
    }
  }

  public async findSystemSettingByServiceType(serviceType: SystemSettingTypeConstant): SystemSettingResponse {
    try {
      const query = {
        serviceType,
      };
      const { _doc: result } = await this._model.findOne(query, { _id: 0 }) as any;

      return result;
    } catch (error) {
      throw LError('[SystemSettingRepository.findSystemSettingByServiceType]: unable to find system setting in database', error);
    }
  }

  public async updateFeatureOTPSetting(serviceType: SystemSettingTypeConstant, flagOTP: boolean): SystemSettingResponse {
    try {
      const query = {
        serviceType,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        { flagOTP },
        {
          new: true,
          fields: { _id: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError('[SystemSettingRepository.updateSystemSetting]: unable to update system setting in database', error);
    }
  }

  public async updateReferralPercentage(serviceType: SystemSettingTypeConstant, referralPercentage: ReferralPercentageBodyRequest): SystemSettingResponse {
    try {
      const query = {
        serviceType,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        referralPercentage,
        {
          new: true,
          fields: { _id: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError('[SystemSettingRepository.updateReferralPercentage]: unable to update system setting in database', error);
    }
  }
}

export default SystemSettingRepository;
