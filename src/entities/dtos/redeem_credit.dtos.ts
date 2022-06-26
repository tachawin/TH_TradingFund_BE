import { RedeemType } from '../schemas/redeem.schema';

export interface RedeemCreditBodyRequest {
  point: number
}

export interface UpdateRedeemCreditParams {
  redeemId: string
}

export interface RedeemCreditListFilterDTO {
  customerId?: string
  startCreated?: string
  endCreated?: string
  minCredit?: string
  maxCredit?: string
  minPoint?: string
  maxPoint?: string
  status?: string | string[]
  redeemType?: RedeemType
  keyword?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface RedeemCreditListFilter {
  customerId?: string
  credit?: number
  point?: number
  status?: { $in: string[] }
  redeemType?: RedeemType
  createdAt?: Date
  keyword?: string
}

export type ListRedeemCreditQueries = RedeemCreditListFilterDTO;
