/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

export interface CashbackHistory {
  cashbackId?: string
  username: string
  type: string
  investAmount: number
  cashback: number
  hash: string
  code?: number
  msg?: string
  status?: 'success' | 'cancel' | 'check'
  dateStart: string
  dateEnd: string
  createdAt?: Date
  updatedAt?: Date
}

export type CashbackHistoryResponse = Promise<CashbackHistory>
export type CashbackHistoryListResponse = Promise<CashbackHistory[]>
export type CashbackHistoryDocument = CashbackHistory & mongoose.Document

const schema = new mongoose.Schema<CashbackHistory>(
  {
    cashbackId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    username: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: '',
    },
    dateStart: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['success', 'cancel', 'check'],
      default: 'success',
    },
    dateEnd: {
      type: String,
      default: '',
    },
    investAmount: {
      type: Number,
      default: 0,
    },
    cashback: {
      type: Number,
      default: 0,
    },
    code: {
      type: Number,
      default: 0,
    },
    msg: {
      type: String,
      default: '',
    },
    hash: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ cashbackId: 1 }, { unique: true });
schema.index({ hash: 1 }, { unique: true });

schema.index({ username: 1, createdAt: 1 });

export const CashbackHistorySchema = schema;
