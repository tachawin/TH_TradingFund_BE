import { RedeemType } from '../schemas/redeem.schema';

export interface RedeemProductBodyRequest {
  productId: string
  address: string
}

export interface UpdateRedeemProductParams {
  redeemId: string
}

export interface UpdateRedeemProductBody {
  notes: string
}

export interface RedeemProductListFilterDTO {
  customerId?: string
  startCreated?: string
  endCreated?: string
  minPoint?: string
  maxPoint?: string
  status?: string | string[]
  keyword?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface RedeemProductListFilter {
  customerId?: string
  point?: number
  status?: { $in: string[] }
  redeemType?: RedeemType
  createdAt?: Date
  keyword?: string
}

export type ListRedeemProductQueries = RedeemProductListFilterDTO;
