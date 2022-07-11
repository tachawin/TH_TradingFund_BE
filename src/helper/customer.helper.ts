import CompanyBankTH from '../entities/constants/company_bank_th';
import { WithdrawListFilterDTO } from '../entities/dtos/withdraw.transaction.dtos';
import { Admin } from '../entities/schemas/admin.schema';
import { Customer } from '../entities/schemas/customer.schema';
import { WithdrawList, Transaction } from '../entities/schemas/transaction.schema';

const findTransactionDetails = (customerList: Customer[], adminList: Admin[], transactionList: Transaction[], filters: WithdrawListFilterDTO) => {
  // TODO: handle this technical dept
  // create map: key is customerId, value is lastDepositAmount
  const customerIdLastDepositMaps: { [key: string]: number } = {};
  customerList.forEach((customer) => {
    const { customerId, lastDepositAmount } = customer;
    customerIdLastDepositMaps[customerId] = lastDepositAmount || 0;
  });

  const adminIdadminNameMaps = {};
  adminList.forEach((adminInfo) => {
    const { adminId, name } = adminInfo;
    adminIdadminNameMaps[adminId] = name;
  });

  // add lastDepositAmount to each transaction by filter
  const result: WithdrawList = [];
  (transactionList as any).forEach(({ _doc: record }) => {
    const {
      customerId, payerBankName, recipientBankName, adminId,
    } = record;
    const resultRecord = { ...record };

    if (payerBankName) {
      const payerBankAcronym = payerBankName.split(' ')[0];
      const payerBank = { ...CompanyBankTH[payerBankAcronym], acronym: payerBankAcronym };
      resultRecord.payerBank = payerBank;
    }

    if (recipientBankName) {
      const recipientBankAcronym = recipientBankName.split(' ')[0];
      const recipientBank = { ...CompanyBankTH[recipientBankAcronym], acronym: recipientBankAcronym };
      resultRecord.recipientBank = recipientBank;
    }

    if (adminId) {
      resultRecord.adminName = adminIdadminNameMaps[adminId];
      delete resultRecord.adminId;
    }

    const recordLastDeposit = customerIdLastDepositMaps[customerId];
    const { minLastDeposit, maxLastDeposit } = filters;
    if (minLastDeposit && recordLastDeposit < minLastDeposit) {
      return;
    }

    if (maxLastDeposit && recordLastDeposit > maxLastDeposit) {
      return;
    }

    resultRecord.lastDepositAmount = recordLastDeposit;

    result.push(resultRecord);
  });

  return result;
};

export {
  findTransactionDetails,
};
