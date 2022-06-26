import BullMQAdapter from '../adapters/bullmq.adapter';

import BANK_CODE from '../entities/constants/bank_code';
import CompanyBankTH from '../entities/constants/company_bank_th';
import { DepositListFilterDTO, UpdateDepositCustomerRequest, DepositActionDTO } from '../entities/dtos/deposit.transaction.dtos';
import {
  DepositListResponse,
  TransactionStatusConstant,
  TransactionTypeConstant,
  TransactionResponse,
} from '../entities/schemas/transaction.schema';

import { LError } from '../helper/errors.handler';
import { generateHashTransaction } from '../helper/wallet.helper';

import CompanyBankRepository from '../repositories/company_bank.repository';
import CustomerRepository from '../repositories/customer.repository';
import TransactionRepository from '../repositories/transaction.repository';

const queue = BullMQAdapter.getInstance();

const transactionRepo = TransactionRepository.getInstance();
const customerRepo = CustomerRepository.getInstance();
const bankCompanyRepo = CompanyBankRepository.getInstance();

async function actionDepositTransaction(transaction: DepositActionDTO, adminId: string): TransactionResponse {
  try {
    const {
      mobileNumber,
      companyBankId,
      transactionTimestamp,
      amount,
      note,
    } = transaction;

    const customer = await customerRepo.findCustomerByMobileNumber(mobileNumber);
    if (!customer) {
      throw LError(`[DepositTransactionUsecase.actionDepositTransaction]: customer not exist with mobileNumber:${mobileNumber}`);
    }

    const bankCompany = await bankCompanyRepo.findCompanyBankByCompanyBankID(companyBankId);
    if (!bankCompany) {
      throw LError(`[DepositTransactionUsecase.actionDepositTransaction]: unable to find bank company from companyBankId:${companyBankId}`);
    }

    const [hash, transactionAt] = generateHashTransaction(customer.bankAccountNumber, mobileNumber, amount);

    await queue.produceDepositJob({
      username: mobileNumber,
      amount,
      hash,
    });

    const timeTransactionAt = transactionTimestamp ? new Date(transactionTimestamp) : transactionAt;

    const result = await transactionRepo.saveTransaction({
      transactionType: TransactionTypeConstant.DEPOSIT,
      payerBankName: customer?.bankName || '',
      payerBankAccountNumber: customer?.bankAccountNumber || '',
      mobileNumber: customer?.mobileNumber || '',
      customerId: customer?.customerId || '',

      companyBankId: bankCompany.bankId,
      recipientBankName: bankCompany.bankName,
      recipientBankAccountNumber: bankCompany.bankAccountNumber,

      transactionTimestamp: timeTransactionAt,
      notes: note || '',

      status: TransactionStatusConstant.SUCCESS,

      adminId,

      amount,
      hash,
    });

    return result;
  } catch (error) {
    throw LError('[DepositTransactionUsecase.actionDepositTransaction]: unable to action deposit transaction', error);
  }
}

async function listDepositTransaction(filters: DepositListFilterDTO): DepositListResponse {
  try {
    const transactions = await transactionRepo.findAllTransactionByType(filters, TransactionTypeConstant.DEPOSIT) as any;
    const result = transactions.map(({ _doc: transaction }) => {
      const { payerBankName, recipientBankName } = transaction;

      const payerBankAcronym = payerBankName.split(' ')[0];
      const payerBank = { ...CompanyBankTH[payerBankAcronym], acronym: payerBankAcronym };

      const recipientBankAcronym = recipientBankName.split(' ')[0];
      const recipientBank = { ...CompanyBankTH[recipientBankAcronym], acronym: recipientBankAcronym };

      return {
        ...transaction, payerBank, recipientBank,
      };
    });

    return result;
  } catch (error) {
    throw LError('[DepositTransactionUsecase.depositTransactionList]: unable to find all deposit transaction', error);
  }
}

async function listDepositTransactionForCustomer(filters: DepositListFilterDTO): DepositListResponse {
  try {
    const result = await transactionRepo.findAllTransactionByType(filters, TransactionTypeConstant.DEPOSIT, {
      transactionId: 1, amount: 1, transactionTimestamp: 1, status: 1,
    });

    return result;
  } catch (error) {
    throw LError('[DepositTransactionUsecase.depositTransactionList]: unable to find all deposit transaction', error);
  }
}

async function updateNoteDeposit(transactionId: string, notes: string, adminId: string): Promise<number> {
  try {
    const transaction = await transactionRepo.findTransactionByTransactionIDAndType(transactionId, TransactionTypeConstant.DEPOSIT);
    if (!transaction) {
      throw LError('[DepositTransactionUsecase.updateDepositNote]: unable to find transaction, transaction not exist');
    }

    const { status } = transaction;
    if (status !== TransactionStatusConstant.SUCCESS && status !== TransactionStatusConstant.CANCEL) {
      throw LError('[DepositTransactionUsecase.updateDepositNote]: transaction status is success or cancel');
    }

    const modifiedCount = await transactionRepo.updateNoteDepositTransaction(transactionId, notes, adminId);

    return modifiedCount;
  } catch (error) {
    throw LError('[DepositTransactionUsecase.updateDepositNote]: unable to update note on deposit transaction', error);
  }
}

async function pickCustomerDeposit(transactionId: string, updateTransaction: UpdateDepositCustomerRequest, adminId: string): Promise<number> {
  try {
    const { mobileNumber, notes } = updateTransaction;

    const transaction = await transactionRepo.findTransactionByTransactionIDAndType(transactionId, TransactionTypeConstant.DEPOSIT);
    if (!transaction) {
      throw LError('[DepositTransactionUsecase.pickCustomerDeposit]: unable to find transaction, transaction not exist');
    }

    const {
      status,
      customerId,
      hash,
      amount,
    } = transaction;
    if (status !== TransactionStatusConstant.NOT_FOUND) {
      throw LError('[DepositTransactionUsecase.pickCustomerDeposit]: transaction status is not found');
    }

    if (customerId) {
      throw LError('[DepositTransactionUsecase.pickCustomerDeposit]: unable mutate, deposit transaction already has customer');
    }

    const customer = await customerRepo.findCustomerByMobileNumber(mobileNumber);
    if (!customer) {
      throw LError('[DepositTransactionUsecase.pickCustomerDeposit]: unable to find customer, customer not exist');
    }

    if (customer.bankAccountNumber !== transaction.payerBankAccountNumber) {
      throw LError('[DepositTransactionUsecase.pickCustomerDeposit]: customer bank account number not matched recipient bank account number on the transaction');
    }

    await queue.produceDepositJob({
      username: mobileNumber,
      amount,
      hash,
    });

    const { customerId: updateCustomerId } = customer;
    const modifiedCount = await transactionRepo.updateCustomerDepositTransaction({
      customerId: updateCustomerId,
      notes: notes || '',
      mobileNumber,
      adminId,

      transactionId,
    });

    return modifiedCount;
  } catch (error) {
    throw LError('[DepositTransactionUsecase.pickCustomerDeposit]: unable to update customer on deposit transaction', error);
  }
}

async function waiveDeposit(transactionId: string, notes: string, adminId: string): Promise<number> {
  try {
    const transaction = await transactionRepo.findTransactionByTransactionIDAndType(transactionId, TransactionTypeConstant.DEPOSIT);
    if (!transaction) {
      throw LError('[DepositTransactionUsecase.waiveDeposit]: unable to find transaction, transaction not exist');
    }

    const {
      status,
      mobileNumber,
      amount,
      hash,
      payerBankAccountNumber: customerBankAccountNumber,
      payerBankName: customerBankName,
      recipientBankAccountNumber: companyBankAccountNumber,
    } = transaction;
    if (status !== TransactionStatusConstant.SUCCESS) {
      throw LError('[DepositTransactionUsecase.waiveDeposit]: transaction status is success');
    }

    const bankCode = BANK_CODE[customerBankName?.split(' ')[0].toUpperCase()].code || '014';

    await queue.produceWithdrawJobAndWaive({
      fromAccount: companyBankAccountNumber,
      accountTo: customerBankAccountNumber,
      bankCode,

      username: mobileNumber,
      hash,

      amount,
    });

    const modifiedCount = await transactionRepo.waiveDepositTransaction(transactionId, notes, adminId);

    return modifiedCount;
  } catch (error) {
    throw LError('[DepositTransactionUsecase.waiveDeposit]: unable to waive deposit transaction', error);
  }
}

export default {
  listDepositTransaction,
  listDepositTransactionForCustomer,
  updateNoteDeposit,
  pickCustomerDeposit,
  waiveDeposit,
  actionDepositTransaction,
};
