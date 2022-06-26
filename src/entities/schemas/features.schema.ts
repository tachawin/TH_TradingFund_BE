import * as mongoose from 'mongoose';

import { validateFeatureAccessLevel } from './validator';

/*
*** format {1111} represents {READ|CREATE|UPDATE|REMOVE}
    | 1 is permission
    | 0 is no permission
*/

export const DEFAULT_FEATURES = {
  ADMIN: {
    report: '1000',
    customer: '1000',
    deposit: '1000',
    withdraw: '1000',
    bank: '1000',
    reward: '1000',
    credit: '1000',
    creditCondition: '1000',
    chat: '1000',
    product: '1000',
    adminManage: '1000',
    level: '1000',
    systemSetting: '1000',
  },
  SUPER_ADMIN: {
    report: '1111',
    customer: '1111',
    deposit: '1111',
    withdraw: '1111',
    bank: '1111',
    reward: '1111',
    credit: '1111',
    creditCondition: '1111',
    chat: '1111',
    product: '1111',
    adminManage: '1111',
    level: '1111',
    systemSetting: '1000',
  },
};

export interface FeatureAccessLevel {
  report: string
  customer: string
  deposit: string
  withdraw: string
  bank: string
  reward: string
  credit: string
  creditCondition: string
  chat: string
  product: string
  adminManage: string
  level: string
  systemSetting: string
}

export type PermissionFeatureResponse = Promise<FeatureAccessLevel>;

const defaultFeatureAccessLevelSchema = {
  type: String,
  default: '1000',
  validate: validateFeatureAccessLevel,
};

export const FeatureAccessLevelSchema = new mongoose.Schema<FeatureAccessLevel>(
  {
    report: defaultFeatureAccessLevelSchema,
    customer: defaultFeatureAccessLevelSchema,
    deposit: defaultFeatureAccessLevelSchema,
    withdraw: defaultFeatureAccessLevelSchema,
    bank: defaultFeatureAccessLevelSchema,
    reward: defaultFeatureAccessLevelSchema,
    credit: defaultFeatureAccessLevelSchema,
    creditCondition: defaultFeatureAccessLevelSchema,
    chat: defaultFeatureAccessLevelSchema,
    product: defaultFeatureAccessLevelSchema,
    adminManage: defaultFeatureAccessLevelSchema,
    level: defaultFeatureAccessLevelSchema,
    systemSetting: defaultFeatureAccessLevelSchema,
  },
  {
    _id: false,
    versionKey: false,
  },
);
