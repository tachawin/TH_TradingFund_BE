/* eslint-disable consistent-return */
import { CURRENT_COMPANY_BANK_SUPPORTED } from '../entities/constants/company_bank_support';
import COMPANY_BANK_TH from '../entities/constants/company_bank_th';
import { TransactionListFilterDTO } from '../entities/dtos/transaction.dtos';
import { ListWithdrawQueries } from '../entities/dtos/withdraw.transaction.dtos';

export function toBankFullName(bankKey: string) {
  const bankNickName = COMPANY_BANK_TH[bankKey].niceName;
  const bankOfficialName = COMPANY_BANK_TH[bankKey].officialName;
  const bankThaiName = COMPANY_BANK_TH[bankKey].thaiName;

  return `${bankKey} ${bankNickName} ${bankOfficialName} ${bankThaiName}`;
}

export function toFilterTransactionUseBankFullName(filters: TransactionListFilterDTO | ListWithdrawQueries): TransactionListFilterDTO | ListWithdrawQueries {
  const { bankName } = filters;

  if (bankName?.length > 0 && typeof filters.bankName !== 'string') {
    filters.bankName.map((bank: string) => {
      if (!(bank.toUpperCase() in CURRENT_COMPANY_BANK_SUPPORTED)) {
        return;
      }

      const bankKey = CURRENT_COMPANY_BANK_SUPPORTED[bank.toUpperCase()];

      return toBankFullName(bankKey);
    });
  }

  return filters;
}
