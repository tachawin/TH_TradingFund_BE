/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

export type CreditConditionStatusActive = 'active';
export type CreditConditionStatusDeleted = 'deleted';
export type CreditConditionStatus = CreditConditionStatusActive | CreditConditionStatusDeleted;

export enum CreditConditionStatusConstant {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

export interface CreditCondition {
  conditionId?: string
  point: number
  credit: number
  quantity?: number
  adminId: string
  status?: CreditConditionStatus
  createdAt?: Date
  updatedAt?: Date
}

export type CreditConditionResponse = Promise<CreditCondition>;
export type CreditConditionListResponse = Promise<CreditCondition[]>;
export type CreditConditionDocument = CreditCondition & mongoose.Document;

const schema = new mongoose.Schema<CreditCondition>(
  {
    conditionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    point: {
      type: Number,
      required: true,
      min: 0,
    },
    credit: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      default: -1,
      min: -1,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ conditionId: 1 }, { unique: true });

schema.index({ point: 1 }, { unique: true });

schema.index({ createdAt: 1 });

export const CreditConditionSchema = schema;
