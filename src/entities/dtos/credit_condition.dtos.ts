import { MongoMatchFilter } from '../interfaces/helper/mongo.types';
import { CreditConditionStatus } from '../schemas/credit_condition.schema';

export interface CreditConditionBodyRequest {
  point: number
  credit: number
  quantity?: number
  adminId: string
}

export interface UpdateCreditConditionParams {
  conditionId: string
}

export interface DeleteCreditConditionBodyRequest {
  conditionId: string
}

export interface UpdateCreditConditionDTO {
  point: number
  credit: number
  quantity?: number
  adminId: string
}

export type UpdateInformationCreditConditionBodyRequest = UpdateCreditConditionDTO

export interface CreditConditionListFilterDTO {
  minPoint?: string
  maxPoint?: string
  minCredit?: string
  maxCredit?: string
  minQuantity?: string
  maxQuantity?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface CreditConditionListFilter {
  status?: CreditConditionStatus | MongoMatchFilter<CreditConditionStatus>
  point?: number
  credit?: number
  quantity?: number
}

export type ListCreditConditionQueries = CreditConditionListFilterDTO;
