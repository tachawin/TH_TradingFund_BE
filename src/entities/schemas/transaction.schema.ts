/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

import { validateMobileNumber } from './validator';

export const SHEET_COLUMNS_TRANSACTION = [
  { header: 'transactionId', key: 'transactionId', width: 26 },
  { header: 'status', key: 'status', width: 10 },
  { header: 'mobileNumber', key: 'mobileNumber', width: 11 },
  { header: 'customerId', key: 'customerId', width: 26 },
  { header: 'payerBankAccountNumber', key: 'payerBankAccountNumber', width: 26 },
  { header: 'payerBankName', key: 'payerBankName', width: 22 },
  { header: 'recipientBankAccountNumber', key: 'recipientBankAccountNumber', width: 26 },
  { header: 'recipientBankName', key: 'recipientBankName', width: 22 },
  { header: 'companyBankId', key: 'companyBankId', width: 26 },
  { header: 'amount', key: 'amount', width: 9 },
  { header: 'transactionType', key: 'transactionType', width: 12 },
  { header: 'adminId', key: 'adminId', width: 26 },
  { header: 'notes', key: 'notes', width: 30 },
  { header: 'payslipPictureURL', key: 'payslipPictureURL', width: 30 },
  { header: 'transactionTimestamp', key: 'transactionTimestamp', width: 9 },
  { header: 'createdAt', key: 'createdAt', width: 9 },
  { header: 'updatedAt', key: 'updatedAt', width: 9 },
];

export type TransactionStatusSuccess = 'success'
export type TransactionStatusNotFound = 'not_found'
export type TransactionStatusCancel = 'cancel'
export type TransactionStatusFailedToSave = 'failed_to_save'
export type TransactionStatus = TransactionStatusSuccess | TransactionStatusNotFound | TransactionStatusCancel | TransactionStatusFailedToSave

export type DepositStatus = TransactionStatus
export type WithdrawStatus = TransactionStatus

export enum TransactionStatusConstant {
  SUCCESS = 'success',
  NOT_FOUND = 'not_found',
  CANCEL = 'cancel',
  FAILED_TO_SAVE = 'failed_to_save'
}

export type TransactionTypeWithdraw = 'withdraw'
export type TransactionTypeRequestWithdraw = 'request_withdraw'
export type TransactionTypeDeposit = 'deposit'
export type TransactionType = TransactionTypeWithdraw | TransactionTypeRequestWithdraw | TransactionTypeDeposit
export type WithdrawType = TransactionTypeWithdraw | TransactionTypeRequestWithdraw

export enum TransactionTypeConstant {
  WITHDRAW = 'withdraw',
  REQUEST_WITHDRAW = 'request_withdraw',
  DEPOSIT = 'deposit',
}

export interface Transaction {
  transactionId?: string
  status: TransactionStatus
  mobileNumber?: string
  customerId?: string
  payerBankAccountNumber?: string
  payerBankName?: string
  recipientBankAccountNumber: string
  recipientBankName: string
  companyBankId?: string
  amount: number
  transactionType: TransactionType
  adminId?: string
  notes?: string
  payslipPictureURL?: string
  transactionTimestamp?: Date
  hash: string
  createdAt?: Date
  updatedAt?: Date
}

interface Bank {
  acronym: string
  officialName: string
  niceName: string
  thaiName: string
}

export type DepositTransaction = Omit<Transaction, ''>

export type WithdrawList = (Transaction & {
  lastDepositAmount?: number
  payerBank: Bank
  recipientBank: Bank
})[]

export type TransactionResponse = Promise<Transaction>
export type TransactionListResponse = Promise<Transaction[]>
export type DepositListResponse = TransactionListResponse;
export type WithdrawListResponse = Promise<WithdrawList>

export type TransactionDocument = Transaction & mongoose.Document

const schema = new mongoose.Schema<Transaction>(
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
      default: '',
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
      required: true,
      trim: true,
    },
    recipientBankName: {
      type: String,
      required: true,
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
schema.index({ hash: 1 }, { unique: true });

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

export const TransactionSchema = schema;
