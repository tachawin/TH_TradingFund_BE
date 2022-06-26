export type AdminLoginRequest = {
  username: string
  password: string
}

export type AdminResendOTPRequest = {
  adminId: string
  refCode: string
}

export type AdminVerifyAdminWithOTPRequest = {
  adminId: string
  refCode: string
  otpConfirm: string
}

export type CustomerLoginRequest = {
  mobileNumber: string
  password: string
}

export type CustomerSendOTPRequest = {
  mobileNumber: string
}

export type CustomerVerifyCustomerWithOTPRequest = {
  mobileNumber: string
  refCode: string
  otpConfirm: string
}

export type AdminUserFormatRequest = {
  refreshToken: string;
  adminId: string
  role: string
  status: string
}

export type CustomerUserFormatRequest = {
  customerId: string
  name: string
  mobileNumber: string
  levelId: string
}
