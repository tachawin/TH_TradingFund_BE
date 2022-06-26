export interface ReferralListWithProfit {
  mobileNumber: string,
  profit: number
}

export interface ReferralListWithProfitResponse {
  customerId: string
  firstReferralList: Array<ReferralListWithProfit>
  secondReferralList: Array<ReferralListWithProfit>
  createdAt?: Date
  updatedAt?: Date
}
