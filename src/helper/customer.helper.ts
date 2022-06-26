import CompanyBankTH from '../entities/constants/company_bank_th';
import { WithdrawListFilterDTO } from '../entities/dtos/withdraw.transaction.dtos';
import { Customer } from '../entities/schemas/customer.schema';
import { WithdrawList, Transaction } from '../entities/schemas/transaction.schema';

const findLastDepositAmount = (customerList: Customer[], transactionList: Transaction[], filters: WithdrawListFilterDTO) => {
  // TODO: handle this technical dept
  // create map: key is customerId, value is lastDepositAmount
  const customerIdLastDepositMaps: { [key: string]: number } = {};
  customerList.forEach((customer) => {
    const { customerId, lastDepositAmount } = customer;
    customerIdLastDepositMaps[customerId] = lastDepositAmount || 0;
  });

  // add lastDepositAmount to each transaction by filter
  const result: WithdrawList = [];
  (transactionList as any).forEach(({ _doc: record }) => {
    const { customerId, payerBankName, recipientBankName } = record;
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
  findLastDepositAmount,
};
