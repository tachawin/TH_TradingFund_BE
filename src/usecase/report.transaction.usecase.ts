/* eslint-disable no-case-declarations */
/* eslint-disable no-param-reassign */
import CompanyBankTH from '../entities/constants/company_bank_th';
import { ReportTransactionFilterDTO } from '../entities/dtos/report.transaction.dto';
import { DashboardAmountTransactionResponse } from '../entities/dtos/transaction.dtos';
import {
  DepositListResponse,
} from '../entities/schemas/transaction.schema';

import { LError } from '../helper/errors.handler';

import TransactionRepository from '../repositories/transaction.repository';

const transactionRepo = TransactionRepository.getInstance();

async function listReportTransaction(filters: ReportTransactionFilterDTO): DepositListResponse {
  try {
    const transactions = await transactionRepo.findAllTransactionByType(filters) as any;

    const result = [];
    transactions.forEach(({ _doc: record }) => {
      const { payerBankName, recipientBankName } = record;

      const payerBankAcronym = payerBankName.split(' ')[0];
      const payerBank = { ...CompanyBankTH[payerBankAcronym], acronym: payerBankAcronym };

      const recipientBankAcronym = recipientBankName.split(' ')[0];
      const recipientBank = { ...CompanyBankTH[recipientBankAcronym], acronym: recipientBankAcronym };

      result.push({
        ...record, payerBank, recipientBank,
      });
    });

    return result;
  } catch (error) {
    throw LError('[ReportTransactionUsecase.listReportTransaction]: unable to find all report transaction', error);
  }
}

async function getAmountTransactionByDay(date: string): Promise<DashboardAmountTransactionResponse> {
  try {
    const result: DashboardAmountTransactionResponse = {
      date,
      am: { withdraw: 0, deposit: 0 },
      pm: { withdraw: 0, deposit: 0 },
    };

    const totalTransactionsAtAM = await transactionRepo.countAmountTransactionAtTwelveByDay('am', date);
    totalTransactionsAtAM.forEach((transaction) => {
      result.am[transaction._id.type] = transaction.totalAmount;
    });

    const totalTransactionsAtPM = await transactionRepo.countAmountTransactionAtTwelveByDay('pm', date);
    totalTransactionsAtPM.forEach((transaction) => {
      result.pm[transaction._id.type] = transaction.totalAmount;
    });

    return result;
  } catch (error) {
    throw LError('[ReportTransactionUsecase.getAmountTransactionByDay]: unable to get sum of transaction per day', error);
  }
}

export default {
  listReportTransaction,
  getAmountTransactionByDay,

};
