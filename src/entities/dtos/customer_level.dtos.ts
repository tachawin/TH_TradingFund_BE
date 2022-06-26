import { MongoMatchFilter } from '../interfaces/helper/mongo.types';
import { LevelStatus } from '../schemas/customer_level.schema';

export interface CustomerLevelBodyRequest {
  levelName: string
  imageURL?: string
  minimumDepositAmount: number
  maximumDepositAmount: number
  investmentAmount: number
  cashback: number
}

export interface UpdateCustomerLevelParams {
  levelId: string
}

export interface DeleteCustomerLevelBodyRequest {
  levelId: string
}

export interface UpdateLevelDTO {
  levelName?: string
  imageURL?: string
  minimumDepositAmount?: number
  maximumDepositAmount?: number
  investmentAmount?: number
  cashback?: number
}

export type UpdateInformationLevelBodyRequest = UpdateLevelDTO

export interface CustomerLevelListFilterDTO {
  startCreated?: string
  endCreated?: string
  startUpdated?: string
  endUpdated?: string
  minMinimumDepositAmount?: string
  maxMinimumDepositAmount?: string
  minMaximumDepositAmount?: string
  maxMaximumDepositAmount?: string
  minInvestment?: string
  maxInvestment?: string
  minCashback?: string
  maxCashback?: string
  keyword?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface CustomerLevelListFilter {
  status?: LevelStatus | MongoMatchFilter<LevelStatus>
  createdAt?: Date
  updatedAt?: Date
  minimumDepositAmount?: number
  maximumDepositAmount?: number
  investmentAmount?: number
  cashback?: number
  keyword?: string
}

export type ListCustomerLevelQueries = CustomerLevelListFilterDTO;
