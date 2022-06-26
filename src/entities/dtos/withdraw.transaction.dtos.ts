import { WithdrawType } from '../schemas/transaction.schema';
import { TransactionListFilterDTO } from './transaction.dtos';

export interface WithdrawTypeParams {
  withdrawType: WithdrawType
}

export interface WithdrawListFilterDTO extends TransactionListFilterDTO {
  minLastDeposit?: number
  maxLastDeposit?: number
}

export interface WithdrawRequestDTO {
  username: string
  amount: number
}

export interface WithdrawActonManualDTO {
  mobileNumber: string
  companyBankId: string
  amount: number
  transactionTimestamp: string
  payslipPictureURL?: string
}

export type ListWithdrawQueries = WithdrawListFilterDTO;
export type WithdrawRequestBody = WithdrawRequestDTO;
export type WithdrawActonManualBodyRequest = WithdrawActonManualDTO
