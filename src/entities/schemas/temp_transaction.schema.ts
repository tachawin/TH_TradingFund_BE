/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

import { TransactionStatus, TransactionType } from './transaction.schema';
import { validateMobileNumber } from './validator';

export interface TempTransaction {
  transactionId?: string
  status: TransactionStatus
  mobileNumber?: string
  customerId?: string
  payerBankAccountNumber?: string
  payerBankName?: string
  recipientBankAccountNumber?: string
  recipientBankName?: string
  companyBankId?: string
  amount: number
  transactionType: TransactionType
  adminId?: string
  notes?: string
  hash: string
  payslipPictureURL?: string
  transactionTimestamp?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type TempTransactionResponse = Promise<TempTransaction>
export type TempTransactionDocument = TempTransaction & mongoose.Document

const schema = new mongoose.Schema<TempTransaction>(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    hash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'not_found', 'cancel', 'pending', 'failed_to_save'],
    },
    mobileNumber: {
      type: String,
      validate: validateMobileNumber,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    payerBankAccountNumber: {
      type: String,
      default: '',
    },
    payerBankName: {
      type: String,
      default: '',
    },
    recipientBankAccountNumber: {
      type: String,
      default: '',
      trim: true,
    },
    recipientBankName: {
      type: String,
      default: '',
    },
    companyBankId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionType: {
      type: String,
      required: true,
      enum: ['withdraw', 'deposit', 'request_withdraw'],
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    notes: {
      type: String,
      default: '',
    },
    payslipPictureURL: {
      type: String,
      default: '',
    },
    transactionTimestamp: {
      type: Date,
      default: new Date(),
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ transactionId: 1 }, { unique: true });

schema.index({ adminId: 1 });
schema.index({ customerId: 1 });
schema.index({ mobileNumber: 1 });

schema.index({ transactionType: 1 });
schema.index({ status: 1 });
schema.index({ amount: 1 });

schema.index({
  transactionType: 1,
  status: 1,
  amount: 1,
  companyBankId: 1,
});

schema.index({ transactionType: 1, payerBankAccountNumber: 1, recipientBankAccountNumber: 1 });
schema.index({ transactionType: 1, recipientBankAccountNumber: 1 });

schema.index({ transactionType: 1, payerBankName: 1, recipientBankName: 1 });
schema.index({ transactionType: 1, recipientBankName: 1 });

schema.index({ createdAt: 1 });

export const TempTransactionSchema = schema;
