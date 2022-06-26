interface BaseWalletAPIDTO {
  code: number
  msg: string
}

export interface CreateWalletDTO extends BaseWalletAPIDTO {
  username: string
  fundingUsername: string
}

export interface GetWalletBalanceDTO extends BaseWalletAPIDTO {
  username: string
  balance: number
}

interface BaseEventRequest {
  username: string
  amount: number
  hash: string
}

export interface DepositRequest extends BaseEventRequest {
}

export interface DepositDTO extends BaseWalletAPIDTO {
  username: string
  beforeBalance: number
  afterBalance: number
  tnId: string
}

export interface WithdrawRequest extends BaseEventRequest {
}

export interface WithdrawAndWaiveRequest extends BaseEventRequest {
  fromAccount: string
  accountTo: string
  bankCode: string
}

export interface WithdrawDTO extends BaseWalletAPIDTO {
  username: string
  beforeBalance: number
  afterBalance: number
  tnId: string
}

export type CreateWalletResponse = Promise<CreateWalletDTO>
export type GetWalletBalanceResponse = Promise<GetWalletBalanceDTO>
export type DepositResponse = Promise<DepositDTO>
export type WithdrawResponse = Promise<WithdrawDTO>
export type EventRequests = WithdrawAndWaiveRequest | WithdrawRequest | DepositRequest
