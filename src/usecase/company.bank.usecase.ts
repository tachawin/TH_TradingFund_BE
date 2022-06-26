import CompanyBankTH from '../entities/constants/company_bank_th';
import { CompanyBankListFilterDTO, UpdateCompanyBankDTO } from '../entities/dtos/company_bank.dtos';
import {
  CompanyBank,
  CompanyBankResponse,
} from '../entities/schemas/company_bank.schema';
import { TransactionTypeConstant, TransactionStatusConstant } from '../entities/schemas/transaction.schema';

import { toBankFullName } from '../helper/bank.handler';
import { LError } from '../helper/errors.handler';
import { toDateTHTimeZoneByDate } from '../helper/time.handler';

import CompanyBankRepository from '../repositories/company_bank.repository';
import TransactionRepository from '../repositories/transaction.repository';

const companyBank = CompanyBankRepository.getInstance();
const transactionRepo = TransactionRepository.getInstance();

async function findCompanyBankList(filters: CompanyBankListFilterDTO): Promise<(CompanyBank & { totalWithdrawToday: number })[]> {
  try {
    const companyBanks = await companyBank.findAllCompanyBank(filters) as any;
    const now = toDateTHTimeZoneByDate();

    const result = [];
    const promises = companyBanks.map(async ({ _doc: bank }) => {
      const { bankId: companyBankId, bankName } = bank;

      const bankAcronym = bankName.split(' ')[0];

      const withdrawTransactionToday = await transactionRepo.findAllTransactionByType({
        status: [TransactionStatusConstant.SUCCESS],
        start: now.toISOString().split('T')[0],
        companyBankId,
      }, TransactionTypeConstant.WITHDRAW);

      let totalWithdrawToday = 0;
      // eslint-disable-next-line array-callback-return
      const sums = withdrawTransactionToday.map(({ amount }) => {
        totalWithdrawToday += amount;
      });

      await Promise.all(sums);

      result.push({
        ...bank, totalWithdrawToday, bankName: { ...CompanyBankTH[bankAcronym], acronym: bankAcronym },
      });
    });

    await Promise.all(promises);

    return result;
  } catch (error) {
    throw LError('[usecase.findCompanyBankList]: unable to find all company bank', error);
  }
}

async function createCompanyBank(companyBankInfo: CompanyBank): CompanyBankResponse {
  try {
    const saveCompanyBank = { ...companyBankInfo };
    const { bankName } = companyBankInfo;

    if (bankName) {
      saveCompanyBank.bankName = toBankFullName(bankName);
    }

    const newCompanyBank = await companyBank.createCompanyBank(saveCompanyBank);

    return newCompanyBank;
  } catch (error) {
    throw LError('[usecase.createCompanyBank]: unable to create bank', error);
  }
}

async function updateCompanyBank(bankId: string, newCompanyBankInfo: UpdateCompanyBankDTO): CompanyBankResponse {
  try {
    const newCompanyBank = await companyBank.updateCompanyBank(bankId, newCompanyBankInfo);

    return newCompanyBank;
  } catch (error) {
    throw LError('[usecase.updateCompanyBank]: unable to update bank information', error);
  }
}

async function deleteCompanyBank(companyBankId: string): Promise<boolean> {
  try {
    const updatedCount = await companyBank.softDeleteCompanyBank(companyBankId);
    if (updatedCount === 0) {
      return false;
    }

    return true;
  } catch (error) {
    throw LError('[usecase.deleteCompanyBank]: unable to delete company bank', error);
  }
}

export default {
  findCompanyBankList,
  createCompanyBank,
  updateCompanyBank,
  deleteCompanyBank,
};
