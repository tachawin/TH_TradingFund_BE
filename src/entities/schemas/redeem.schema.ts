/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

import { validateMobileNumber } from './validator';

export type RedeemStatusRequest = 'request';
export type RedeemStatusSending = 'sending';
export type RedeemStatusSuccess = 'success';
export type RedeemStatusReject = 'reject';
export type RedeemStatus = RedeemStatusRequest | RedeemStatusSending | RedeemStatusSuccess | RedeemStatusReject;

export enum RedeemStatusConstant {
  REQUEST = 'request',
  SENDING = 'sending',
  SUCCESS = 'success',
  REJECT = 'reject',
}

export type RedeemTypeCredit = 'credit';
export type RedeemTypeProduct = 'product';
export type RedeemType = RedeemTypeCredit | RedeemTypeProduct;

export enum RedeemTypeConstant {
  CREDIT = 'credit',
  PRODUCT = 'product',
}

export interface Redeem {
  redeemId?: string
  mobileNumber: string
  customerId: string
  productId?: string
  credit?: number
  point: number
  address?: string
  notes?: string
  adminId?: string
  status?: RedeemStatus
  redeemType: RedeemType
  createdAt?: Date
  updatedAt?: Date
}

export interface RedeemResult extends Redeem {
  productName?: string
  adminName?: string
}

export type RedeemResponse = Promise<RedeemResult>;
export type RedeemListResponse = Promise<RedeemResult[]>;

export type RedeemDocument = Redeem & mongoose.Document;

const schema = new mongoose.Schema<Redeem>(
  {
    redeemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    status: {
      type: String,
      enum: ['request', 'sending', 'success', 'reject'],
      default: 'request',
    },
    mobileNumber: {
      type: String,
      required: true,
      validate: validateMobileNumber,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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
    address: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    redeemType: {
      type: String,
      enum: ['credit', 'product'],
      default: 'credit',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ redeemId: 1 }, { unique: true });

schema.index({ customerId: 1 });
schema.index({ mobileNumber: 1 });
schema.index({ address: 1 });
schema.index({ notes: 1 });
schema.index({ adminId: 1 });
schema.index({ productId: 1 });

schema.index({ status: 1, credit: 1 });
schema.index({ status: 1, point: 1 });
schema.index({ status: 1, redeemType: 1 });

schema.index({ createdAt: 1 });

export const RedeemSchema = schema;
