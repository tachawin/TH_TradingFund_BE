export interface CustomerBodyRequest {
  password: string
  name: string
  mobileNumber: string
  bankAccountNumber: string
  bankName: string
  ref?: string
}

export interface GetCustomerByIdParams {
  customerId: string
}

export interface UpdateCustomerPasswordBodyRequest {
  oldPassword: string
  newPassword: string
}

export interface DeleteCustomerBodyRequest {
  customerId: string
}

export interface DeleteActionCustomerParams {
  action: string
}

export interface UpdateCustomerDTO {
  name?: string
  lastLoginAt?: Date
}

export interface CustomerListFilterDTO {
  level?: string | string[]
  bank?: string | string[]
  startCreated?: string
  endCreated?: string
  startLastLogin?: string
  endLastLogin?: string
  keyword?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface CustomerListFilter {
  bankName?: { $in: string[] }
  levelId?: { $in: string[] }
  createdAt?: Date
  lastLoginAt?: Date
  keyword?: string
}

export type ListCustomerQueries = CustomerListFilterDTO;

export interface DashboardCustomerRegisterAndActionQueries {
  dateStart?: string
  dateEnd?: string
}

export interface DashboardAmountCustomerByDay {
  [key: string]: { totalRegister: number, totalRegisterAndAction: number }
}

export interface CustomerAddressBodyRequest {
  address: string
  zipCode: number
}

export interface AddressIdParams {
  addressId: string
}
