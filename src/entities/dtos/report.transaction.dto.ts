import { TransactionType } from '../schemas/transaction.schema';
import { TransactionListFilterDTO } from './transaction.dtos';

export interface ReportTransactionFilterDTO extends TransactionListFilterDTO {
  minLastDeposit?: number
  masLastDeposit?: number
  transactionType?: TransactionType | TransactionType[]
}

export interface DashboardReportTransactionByDateQueries {
  date?: string
}

export type ListReportQueries = ReportTransactionFilterDTO
