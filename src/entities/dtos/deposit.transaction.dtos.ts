import { TransactionTypeDeposit } from '../schemas/transaction.schema';
import {
  TransactionListFilter, TransactionListFilterDTO,
} from './transaction.dtos';

export interface UpdateDepositNoteRequest {
  notes: string
}

export interface UpdateDepositCustomerRequest {
  mobileNumber: string
  notes?: string
}

export interface UpdateDepositCustomerDTO {
  transactionId: string
  customerId: string
  adminId: string
  mobileNumber: string
  notes?: string
}

export interface DepositIdentifyParams {
  transactionId: string
}

export interface DepositListFilter extends TransactionListFilter {
  transactionType: TransactionTypeDeposit
}

export interface DepositActionDTO {
  mobileNumber: string
  companyBankId: string
  amount: number
  transactionTimestamp: string
  note?: string
}

export type DepositActionBodyRequest = DepositActionDTO
export type DepositListFilterDTO = TransactionListFilterDTO;
export type ListDepositQueries = DepositListFilterDTO;
