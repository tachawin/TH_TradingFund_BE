import * as mongoose from 'mongoose';

import { StatusObject } from '../interfaces/helper/constants.types';

import { validateMobileNumber } from './validator';

export type CustomerStatusActive = 'active';
export type CustomerStatusDeleted = 'deleted';
export type CustomerStatus = CustomerStatusActive | CustomerStatusDeleted;

export const CUSTOMER_STATUS: StatusObject<CustomerStatus> = {
  ACTIVE: 'active',
  DELETED: 'deleted',
};

export interface CustomerAddress {
  addressId: string
  address: string
  zipCode: number
  isPresentAddress: boolean
}

export interface Customer {
  customerId?: string
  password: string
  name: string
  mobileNumber: string
  bankAccountName: string
  bankAccountNumber: string
  bankName: string
  credit?: number
  point?: number
  cashbackBonus?: number
  referralBonus?: number
  lastDepositAmount?: number
  totalDepositAmount?: number
  referralLink: string
  lastLoginAt?: Date
  status?: CustomerStatus
  address?: CustomerAddress[]
  createdAt?: Date
  updatedAt?: Date
}

interface CustomerLevel {
  levelId: string
  levelName: string
  color: string
}

interface CustomerBank {
  acronym: string
  officialName: string
  niceName: string
  thaiName: string
}

type CustomerSaveResult = Omit<Customer, 'password'>;

export type CustomerSaveResponse = Promise<CustomerSaveResult>;
export type CustomerWithLevelResponse = Customer & { level: CustomerLevel } & { bank: CustomerBank }
export type CustomerResponse = Promise<Customer>;
export type CustomerListResponse = Promise<Customer[]>;
export type CustomerDocument = Customer & mongoose.Document;
export type CustomerLoginResponse = Pick<Customer, 'name' | 'mobileNumber' | 'bankAccountName' | 'bankAccountNumber' | 'bankName'>;
export type CustomerMobileNumberResponse = Pick<Customer, 'mobileNumber'>

const schema = new mongoose.Schema<Customer>(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      validate: validateMobileNumber,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: () => Date.now(),
    },
    bankAccountName: {
      type: String,
      default: '',
    },
    bankAccountNumber: {
      type: String,
      default: '',
      trim: true,
    },
    bankName: {
      type: String,
      default: '',
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    point: {
      type: Number,
      default: 0,
      min: 0,
    },
    cashbackBonus: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    referralBonus: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastDepositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDepositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralLink: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
    },
    address: [{
      _id: false,
      addressId: { type: mongoose.Schema.Types.ObjectId, auto: true },
      address: { type: String },
      zipCode: { type: Number },
      isPresentAddress: { type: Boolean, default: false },
    }],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ customerId: 1 }, { unique: true });
schema.index({ mobileNumber: 1 }, { unique: true });

schema.index({ name: 1 });

schema.index({ bankAccountName: 1 });
schema.index({ bankAccountNumber: 1 });
schema.index({ bankName: 1 });

schema.index({ createdAt: 1 });

export const CustomerSchema = schema;
