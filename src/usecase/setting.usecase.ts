import {
  ReferralPercentageBodyRequest,
} from '../entities/dtos/setting.dtos';
import {
  SystemSettingTypeConstant,
  SystemSetting,
  SystemSettingResponse,
  SystemSettingListResponse,
} from '../entities/schemas/setting.schema';

import { LError } from '../helper/errors.handler';

import SystemSettingRepository from '../repositories/setting.repository';

const systemSettingRepo = SystemSettingRepository.getInstance();

async function newSettingServiceType(setting: SystemSetting): Promise<void> {
  try {
    await systemSettingRepo.saveSystemSetting(setting);
  } catch (error) {
    throw LError('[SystemUsecase.newSettingServiceType]: unable to new system setting type', error);
  }
}

async function settingOTP(serviceType: SystemSettingTypeConstant, flagOTP: boolean): Promise<void> {
  try {
    await systemSettingRepo.updateFeatureOTPSetting(serviceType, flagOTP);
  } catch (error) {
    throw LError(`[SystemUsecase.settingOTP]: unable to set OTP feature flag to ${flagOTP} on ${serviceType} setting`, error);
  }
}

async function referralPercentageSetting(serviceType: SystemSettingTypeConstant, referral: ReferralPercentageBodyRequest): Promise<void> {
  try {
    await systemSettingRepo.updateReferralPercentage(serviceType, referral);
  } catch (error) {
    throw LError(`[SystemUsecase.referralPercentageSetting]: unable to set referral percentage to ${referral} on ${serviceType} setting`, error);
  }
}

async function getSystemSettingByServiceType(serviceType: SystemSettingTypeConstant): SystemSettingResponse {
  try {
    const setting = await systemSettingRepo.findSystemSettingByServiceType(serviceType);
    return setting;
  } catch (error) {
    throw LError(`[SystemUsecase.getSystemSettingByServiceType]: unable to get system setting on ${serviceType} setting`, error);
  }
}

async function currentSetting(): Promise<SystemSettingListResponse> {
  try {
    const settings = await systemSettingRepo.findAllSystemSetting();

    return settings;
  } catch (error) {
    throw LError('[SystemUsecase.currentSetting]: unable to get current setting', error);
  }
}

export default {
  settingOTP,
  currentSetting,
  newSettingServiceType,
  referralPercentageSetting,
  getSystemSettingByServiceType,
};
