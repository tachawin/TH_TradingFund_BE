import { MongoMatchFilter } from '../interfaces/helper/mongo.types';
import {
  TransactionType,
  TransactionTypeConstant,
  TransactionStatus,
} from '../schemas/transaction.schema';

export interface TransactionWebhookEvent {
  fromAccountNo: string
  toAccountNo: string
  amount: number
  hash: string
  transactionDate: Date
  note?: string
}

export interface BaseTransactionExternalAction {
  fromAccount: string
  accountTo: string
  bankCode: string
  amount: number
}

export interface DepositExternalActionBody extends BaseTransactionExternalAction {
}
export interface WithdrawExternalActionBody extends BaseTransactionExternalAction {
}

export interface WithdrawExternalActionResult {
  transactionId: string
  transactionDateTime: Date
  remainingBalance: number
  QRString: string
}

export type WithdrawExternalActionResponse = Promise<WithdrawExternalActionResult>

export interface TransactionListFilter {
  status?: TransactionStatus | MongoMatchFilter<TransactionStatus>
  transactionType?: TransactionType | MongoMatchFilter<TransactionType>
  customerId?: string
  companyBankId?: string | MongoMatchFilter<string>
}

export interface TransactionListFilterDTO {
  status?: TransactionStatus | TransactionStatus[]
  bankName?: string | string[]
  companyBankId?: string | string[]
  customerId?: string

  start?: string
  end?: string

  min?: string
  max?: string

  keyword?: string

  sortField?: string
  sortDirection?: 'asc' | 'desc'

  transactionType?: TransactionType | TransactionType[]
}

export interface DashboardAmountTransactionByDayResult {
  _id: { type: TransactionTypeConstant }
  totalAmount: number
}

export interface DataAmountTransaction {
  deposit?: number
  withdraw?: number
}
export interface DashboardAmountTransactionResponse {
  date: string
  am?: DataAmountTransaction
  pm?: DataAmountTransaction
}
