import { MongoMatchFilter } from '../interfaces/helper/mongo.types';

import { AdminRole, AdminStatus } from '../schemas/admin.schema';
import { FeatureAccessLevel } from '../schemas/features.schema';

export interface AdminLoginCredentialDTO {
  useOTP: boolean
  adminId?: string
  refCode?: string
  accessToken?: string
  refreshToken?: string
}

export interface AdminBodyRequest {
  username: string;
  password: string;
  name: string;
  mobileNumber: string;
  role: AdminRole
  status?: AdminStatus
  features?: FeatureAccessLevel;
}

export interface DeleteAdminBodyRequest {
  adminId: string
}

export interface DeleteActionAdminParams {
  action: string
}

export interface UpdateAdminParams {
  adminId: string
}

export interface UpdateAdminDTO {
  status?: AdminStatus
  role?: AdminRole
  name?: string
  mobileNumber?: string
  password?: string
}

export type UpdateInformationAdminBodyRequest = UpdateAdminDTO

export interface AdminListFilterDTO {
  status?: AdminStatus
  role?: string | AdminRole[]
  startCreated?: string
  endCreated?: string
  startUpdated?: string
  endUpdated?: string
  keyword?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface AdminListFilter {
  status?: AdminStatus | MongoMatchFilter<AdminStatus>
  role?: MongoMatchFilter<AdminRole>
  createdAt?: Date
  updatedAt?: Date
  keyword?: string
}

export type ListAdminQueries = AdminListFilterDTO;
