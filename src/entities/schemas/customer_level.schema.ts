/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

export type LevelStatusActive = 'active';
export type LevelStatusDeleted = 'deleted';
export type LevelStatus = LevelStatusActive | LevelStatusDeleted;

export enum CustomerLevelStatusConstant {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

export interface CustomerLevel {
  levelId?: string
  levelName: string
  imageURL?: string
  minimumDepositAmount: number
  maximumDepositAmount: number
  investmentAmount: number
  cashback: number
  status?: LevelStatus
  createdAt?: Date
  updatedAt?: Date
}

export type CustomerLevelResponse = Promise<CustomerLevel>;
export type CustomerLevelListResponse = Promise<CustomerLevel[]>;

export type CustomerLevelDocument = CustomerLevel & mongoose.Document;

const schema = new mongoose.Schema<CustomerLevel>(
  {
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    levelName: {
      type: String,
      required: true,
    },
    imageURL: {
      type: String,
      default: '',
    },
    minimumDepositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maximumDepositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    investmentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cashback: {
      type: Number,
      default: 0,
      min: 0,
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

schema.index({ levelId: 1 }, { unique: true });
schema.index({ levelName: 1 }, { unique: true });
schema.index({ minimumDepositAmount: 1 }, { unique: true });

export const CustomerLevelSchema = schema;
