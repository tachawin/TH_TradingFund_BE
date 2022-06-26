/* eslint-disable no-unused-vars */

import * as mongoose from 'mongoose';

export type TypeSystemSettingAdmin = 'admin'
export type TypeSystemSettingCustomer = 'customer'
export type TypeSystemSetting = TypeSystemSettingAdmin | TypeSystemSettingCustomer

export enum SystemSettingTypeConstant {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
}

export interface BaseSystemSetting {
  serviceType: TypeSystemSetting
  flagOTP?: boolean
}

export interface AdminSystemSetting extends BaseSystemSetting {
}

export interface CustomerSystemSetting extends BaseSystemSetting {
  firstReferralPercentage: Number,
  secondReferralPercentage: Number,
}

export type SystemSetting = AdminSystemSetting & CustomerSystemSetting
export type SystemSettingResponse = Promise<SystemSetting>;
export type SystemSettingListResponse = Promise<SystemSetting[]>;
export type SystemSettingDocument = SystemSetting & mongoose.Document;

const schema = new mongoose.Schema<SystemSetting>(
  {
    serviceType: {
      type: String,
      required: true,
      trim: true,
      enum: ['admin', 'customer'],
    },
    flagOTP: {
      type: Boolean,
      default: true,
    },
    firstReferralPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    secondReferralPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    versionKey: false,
  },
);

schema.index({ serviceType: 1 }, { unique: true });

export const SystemSettingSchema = schema;
