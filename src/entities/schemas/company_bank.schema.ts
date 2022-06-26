import * as mongoose from 'mongoose';

import { StatusObject } from '../interfaces/helper/constants.types';

export type CompanyBankStatusActive = 'active';
export type CompanyBankStatusInActive = 'inactive';
export type CompanyBankStatusDeleted = 'deleted';
export type CompanyBankStatus = CompanyBankStatusActive | CompanyBankStatusInActive | CompanyBankStatusDeleted;

export type CompanyBankTypeDeposit = 'deposit';
export type CompanyBankTypeWithdraw = 'withdraw';
export type CompanyBankTypeDepositAndWithdraw = 'deposit_and_withdraw';
export type CompanyBankType = CompanyBankTypeDeposit | CompanyBankTypeWithdraw | CompanyBankTypeDepositAndWithdraw;

export const COMPANY_BANK_TYPE: StatusObject<CompanyBankType> = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  DEPOSIT_AND_WITHDRAW: 'deposit_and_withdraw',
};

export const COMPANY_BANK_STATUS: StatusObject<CompanyBankStatus> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
};

export interface CompanyBank {
  bankId?: string
  bankAccountName: string
  bankAccountNumber: string
  bankName: string
  balance: number
  type: CompanyBankType
  status: CompanyBankStatus
  createdAt?: Date
  updatedAt?: Date
}

export type CompanyBankResponse = Promise<CompanyBank>;
export type CompanyBankListResponse = Promise<CompanyBank[]>;

export type CompanyBankDocument = CompanyBank & mongoose.Document;

const schema = new mongoose.Schema<CompanyBank>(
  {
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    bankAccountName: {
      type: String,
      required: true,
    },
    bankAccountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdraw', 'deposit_and_withdraw'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ bankId: 1 }, { unique: true });

schema.index({ bankAccountName: 1 });
schema.index({ bankAccountNumber: 1 });
schema.index({ bankName: 1 });
schema.index({ type: 1 });
schema.index({ status: 1 });

schema.index({ createdAt: 1 });

export const CompanyBankSchema = schema;
