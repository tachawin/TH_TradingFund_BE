import { RedeemStatus } from '../schemas/redeem.schema';

export interface RedeemStatusParams {
  redeemStatus: string
}

export interface UpdateRedeemDTO {
  notes?: string
  status?: RedeemStatus
  adminId?: string
}
