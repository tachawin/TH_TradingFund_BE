import { AdminRole, AdminStatus } from '../../schemas/admin.schema';
import { FeatureAccessLevel } from '../../schemas/features.schema';

export interface AdminAccessTokenPayload {
  adminId: string
  username: string
  role: AdminRole
  status: AdminStatus
  name: string
  mobileNumber: string
  features: FeatureAccessLevel
}

export interface AdminRefreshTokenPayload {
  adminId: string
  role: string
  status: string
}

export interface CustomerAccessTokenPayload {
  customerId: string
  name: string
  mobileNumber: string
  // levelId: string
}

export interface CustomerRefreshTokenPayload {
  customerId: string
  // levelId: string
}

export interface APITokenPayload {
  domain?: string
  serviceName: string
  createdAt?: Date
  serviceType?: string
  apiToken?: string
}
