/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
import BullMQAdapter from '../adapters/bullmq.adapter';

import { TransactionWebhookEvent } from '../entities/dtos/transaction.dtos';
import {
  Transaction,

  TransactionStatusConstant,
  TransactionTypeConstant,
} from '../entities/schemas/transaction.schema';

import { LError } from '../helper/errors.handler';
import { toDateTHTimeZoneByDate } from '../helper/time.handler';

import CompanyBankRepository from '../repositories/company_bank.repository';
import CustomerRepository from '../repositories/customer.repository';
import TempTransactionRepository from '../repositories/temp.transaction.repository';
import TransactionRepository from '../repositories/transaction.repository';

const queue = BullMQAdapter.getInstance();

const transactionRepo = TransactionRepository.getInstance();
const tempTransactionRepo = TempTransactionRepository.getInstance();
const customerRepo = CustomerRepository.getInstance();
const bankCompanyRepo = CompanyBankRepository.getInstance();

async function saveDepositTransaction(event: TransactionWebhookEvent): Promise<void> {
  const {
    fromAccountNo: payerBankAccountNumber,
    toAccountNo: bankCompanyAccountNumber,
    transactionDate,
    hash,
    amount,
    note,
  } = event;

  let DEPOSIT_STATUS = TransactionStatusConstant.SUCCESS;

  let transactionAt = toDateTHTimeZoneByDate();
  if (transactionDate) {
    transactionAt = new Date(transactionDate);
  }

  try {
    if (!hash) {
      throw LError('[WebhookTransactionUsecase.saveDepositTransaction]: unable to process the event, hash field required');
    }

    const customers = await customerRepo.findCustomerByAccountNumber(payerBankAccountNumber);
    if (customers.length !== 1) {
      DEPOSIT_STATUS = TransactionStatusConstant.NOT_FOUND;
    }

    let customer = null;
    if (customers.length >= 1) {
      // eslint-disable-next-line prefer-destructuring
      customer = customers[0];
    }

    if (customer && customer.bankAccountNumber !== payerBankAccountNumber) {
      throw LError('[WebhookTransactionUsecase.saveDepositTransaction]: customer bank account number not matched in database');
    }

    const bankCompany = await bankCompanyRepo.findCompanyBankByBankAccountNumber(bankCompanyAccountNumber);
    if (!bankCompany) {
      throw LError(`[WebhookTransactionUsecase.saveDepositTransaction]: unable to find bank company from bankAccountNumber:${bankCompanyAccountNumber}`);
    }

    if (bankCompany.bankAccountNumber !== bankCompanyAccountNumber) {
      throw LError('[WebhookTransactionUsecase.saveDepositTransaction]: company bank account number not matched in database');
    }

    let transaction: Transaction = {
      transactionType: TransactionTypeConstant.DEPOSIT,

      companyBankId: bankCompany.bankId,

      recipientBankName: bankCompany.bankName,
      recipientBankAccountNumber: bankCompany.bankAccountNumber,

      transactionTimestamp: transactionAt,
      notes: note,

      status: DEPOSIT_STATUS,

      payerBankAccountNumber,
      amount,
      hash,
    };

    if (customer) {
      transaction.customerId = customer.customerId;

      transaction = {
        ...transaction,
        payerBankName: customer.bankName,
        payerBankAccountNumber: customer.bankAccountNumber,
        mobileNumber: customer.mobileNumber,
      };

      await queue.produceDepositJob({
        username: customer.mobileNumber,
        amount,
        hash,
      });
    }

    await transactionRepo.saveTransaction(transaction);
  } catch (error) {
    const transaction: Transaction = {
      transactionType: TransactionTypeConstant.DEPOSIT,
      payerBankName: '',

      recipientBankName: '',
      recipientBankAccountNumber: bankCompanyAccountNumber,

      transactionTimestamp: transactionAt,
      notes: note,

      status: DEPOSIT_STATUS,

      payerBankAccountNumber,

      amount,
      hash,

    };

    await tempTransactionRepo.saveDepositTempTransaction(transaction);
    console.info('[WebhookTransactionUsecase.saveDepositTransaction]: save deposit transaction to temp database successfully ✅');

    throw LError(`[WebhookTransactionUsecase.saveDepositTransaction]: unable to save deposit transaction event from webhook, hash:${hash || 'hash_unknown'}`, error);
  }
}

export default {
  saveDepositTransaction,
};
