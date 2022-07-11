import { MongoMatchFilter } from '../interfaces/helper/mongo.types';
import { CompanyBankStatus, CompanyBankType } from '../schemas/company_bank.schema';

export interface CompanyBankBodyRequest {
  bankAccountName: string
  bankAccountNumber: string
  bankName: string
  balance: number
  type: CompanyBankType
  status: CompanyBankStatus
}

export interface DeleteCompanyBankBodyRequest {
  bankId: string
}

export interface UpdateCompanyBankParams {
  bankId: string
}

export interface UpdateCompanyBankDTO {
  bankAccountName?: string
  bankAccountNumber?: string
  bankName?: string
  type?: CompanyBankType
  status?: CompanyBankStatus
}

export type UpdateInformationCompanyBankBodyRequest = UpdateCompanyBankDTO

export interface CompanyBankListFilterDTO {
  type?: string | string[]
  bank?: string | string[]
  status?: CompanyBankStatus | CompanyBankStatus[]
  startCreated?: string
  endCreated?: string
  keyword?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface CompanyBankListFilter {
  type?: { $in: string[] }
  status?: CompanyBankStatus | MongoMatchFilter<CompanyBankStatus>
  bankName?: { $in: string[] }
  createdAt?: Date
  keyword?: string
}

export type ListCompanyBankQueries = CompanyBankListFilterDTO;
