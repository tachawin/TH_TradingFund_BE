export type BankInformation = {
  id: number
  officialName: string
  niceName: string
  thaiName: string
}

export type CompanyBankTHType = {
  [key: string]: BankInformation
};
