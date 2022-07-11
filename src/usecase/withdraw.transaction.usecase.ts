/* eslint-disable consistent-return */
import AWSAdapter from '../adapters/aws.adapter';
import BullMQAdapter from '../adapters/bullmq.adapter';
import TransactionClientAdapter from '../adapters/transaction.client.adapter';
import WalletClientAdapter from '../adapters/wallet.client.adapter';

import BANK_CODE from '../entities/constants/bank_code';
import { TRANSACTION_STATUS_ACTION } from '../entities/constants/transaction.state';
import { WithdrawActonManualDTO, WithdrawListFilterDTO, WithdrawRequestDTO } from '../entities/dtos/withdraw.transaction.dtos';
import {
  WithdrawType,
  WithdrawListResponse,
  TransactionTypeConstant,
  TransactionStatusConstant,
  Transaction,
} from '../entities/schemas/transaction.schema';
import { findTransactionDetails } from '../helper/customer.helper';

import { LError } from '../helper/errors.handler';
import { generateHashTransaction } from '../helper/wallet.helper';
import AdminRepository from '../repositories/admin.repository';

import CompanyBankRepository from '../repositories/company_bank.repository';
import CustomerRepository from '../repositories/customer.repository';
import TransactionRepository from '../repositories/transaction.repository';

const awsAdapter = AWSAdapter.getInstance();
const transactionClient = TransactionClientAdapter.getInstance();
const walletClient = WalletClientAdapter.getInstance();
const queue = BullMQAdapter.getInstance();

const adminRepo = AdminRepository.getInstance();
const transactionRepo = TransactionRepository.getInstance();
const customerRepo = CustomerRepository.getInstance();
const bankCompanyRepo = CompanyBankRepository.getInstance();

async function actionWithdrawTransactionAutomatic(transaction: WithdrawActonManualDTO, adminId: string): Promise<[Transaction, Error]> {
  const {
    mobileNumber,
    companyBankId,
    amount,
  } = transaction;

  let TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.START;

  let bankCompanyRecoverBalance = -1;
  let bankCompanyRecoverAccountNumber = '';

  try {
    const customer = await customerRepo.findCustomerByMobileNumber(mobileNumber);
    if (!customer) {
      return [null, LError(`[WithdrawTransactionUsecase.actionWithdrawTransactionAutomatic]: customer not exist with mobileNumber:${mobileNumber}`)];
    }

    const { balance } = await walletClient.balance(mobileNumber);

    if (balance < amount) {
      return [null, LError('CREDIT_NOT_ENOUGH')];
    }

    const bankCompany = await bankCompanyRepo.findCompanyBankByCompanyBankID(companyBankId);
    if (!bankCompany) {
      return [null, LError(`[WithdrawTransactionUsecase.actionWithdrawTransactionAutomatic]: unable to find bank company from companyBankId:${companyBankId}`)];
    }
    bankCompanyRecoverBalance = bankCompany.balance;
    bankCompanyRecoverAccountNumber = bankCompany.bankAccountNumber;
    const bankCode = BANK_CODE[customer.bankName.split(' ')[0].toUpperCase()].code || '014';

    const { remainingBalance } = await transactionClient.withdraw({
      fromAccount: bankCompany.bankAccountNumber,
      accountTo: customer.bankAccountNumber,
      bankCode,
      amount,
    });
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.BANK.WITHDRAW;

    await bankCompanyRepo.updateBalanceCompanyBank(bankCompany.bankAccountNumber, remainingBalance);
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.COMPANY.UPDATE.BALANCE;

    const {
      bankAccountName: recipientBankName,
      bankAccountNumber: recipientBankAccountNumber,
      customerId,
    } = customer;

    const {
      bankAccountName: payerBankName,
      bankAccountNumber: payerBankAccountNumber,
    } = bankCompany;

    const [hash, transactionAt] = generateHashTransaction(customer.bankAccountNumber, mobileNumber, amount);

    const result = await transactionRepo.saveTransaction({
      transactionType: TransactionTypeConstant.WITHDRAW,
      status: TransactionStatusConstant.SUCCESS,

      transactionTimestamp: transactionAt,

      mobileNumber,
      customerId,
      recipientBankAccountNumber,
      recipientBankName,

      payerBankAccountNumber,
      payerBankName,
      companyBankId,

      adminId,

      hash,
      amount,
    });
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.TRANSACTION.CREATED;

    return [result, null];
  } catch (error) {
    if (TRANSACTION_STATUS === TRANSACTION_STATUS_ACTION.BANK.WITHDRAW) {
      LError('[WithdrawTransactionUsecase.actionWithdrawTransactionAutomatic]: ****URGENT ERROR: have to deposit manual');
    }

    if (TRANSACTION_STATUS === TRANSACTION_STATUS_ACTION.COMPANY.UPDATE.BALANCE) {
      LError('[WithdrawTransactionUsecase.actionWithdrawTransactionAutomatic]: ****URGENT ERROR: have to deposit manual');

      if (bankCompanyRecoverAccountNumber !== '' || bankCompanyRecoverBalance !== -1) {
        await bankCompanyRepo.updateBalanceCompanyBank(bankCompanyRecoverAccountNumber, bankCompanyRecoverBalance);

        console.info('[WithdrawTransactionUsecase.actionWithdrawTransactionAutomatic]: recover update company bank credit balance successfully ✅');
      } else {
        LError('[WithdrawTransactionUsecase.actionWithdrawTransactionAutomatic]: ****URGENT ERROR: have to update company bank balance');
      }
    }

    throw LError(`[WithdrawTransactionUsecase.actionWithdrawTransactionAutomatic]: unable to action withdraw transaction automatically, TRANSACTION_STATUS:${TRANSACTION_STATUS}`, error);
  }
}

async function actionWithdrawTransactionManual(transaction: WithdrawActonManualDTO, adminId: string): Promise<[Transaction, Error]> {
  const {
    mobileNumber,
    companyBankId,
    amount,
    payslipPictureURL,
    transactionTimestamp,
  } = transaction;

  let bankCompanyRecoverAccountNumber = '';

  let TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.START;
  try {
    const customer = await customerRepo.findCustomerByMobileNumber(mobileNumber);
    if (!customer) {
      return [null, LError(`[WithdrawTransactionUsecase.actionWithdrawTransactionManual]: customer not exist with mobileNumber:${mobileNumber}`)];
    }

    const bankCompany = await bankCompanyRepo.findCompanyBankByCompanyBankID(companyBankId);
    if (!bankCompany) {
      return [null, LError(`[WithdrawTransactionUsecase.actionWithdrawTransactionManual]: unable to find bank company from companyBankId:${companyBankId}`)];
    }

    const {
      bankAccountName: recipientBankName,
      bankAccountNumber: recipientBankAccountNumber,
      customerId,
    } = customer;

    const {
      bankAccountName: payerBankName,
      bankAccountNumber: payerBankAccountNumber,
    } = bankCompany;

    bankCompanyRecoverAccountNumber = payerBankAccountNumber;

    const [hash, transactionAt] = generateHashTransaction(customer.bankAccountNumber, mobileNumber, amount);

    const timeTransactionAt = transactionTimestamp ? new Date(transactionTimestamp) : transactionAt;

    await bankCompanyRepo.increaseBalanceCompanyBank(bankCompany.bankAccountNumber, amount);
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.COMPANY.UPDATE.BALANCE;

    const result = await transactionRepo.saveTransaction({
      transactionType: TransactionTypeConstant.WITHDRAW,
      status: TransactionStatusConstant.SUCCESS,

      transactionTimestamp: timeTransactionAt,

      mobileNumber,
      customerId,
      recipientBankAccountNumber,
      recipientBankName,

      payerBankAccountNumber,
      payerBankName,
      companyBankId,

      adminId,

      hash,
      amount,
      payslipPictureURL,
    });
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.TRANSACTION.CREATED;

    return [result, null];
  } catch (error) {
    if (TRANSACTION_STATUS === TRANSACTION_STATUS_ACTION.COMPANY.UPDATE.BALANCE) {
      await bankCompanyRepo.decreaseBalanceCompanyBank(bankCompanyRecoverAccountNumber, amount);

      console.info('[WithdrawTransactionUsecase.actionWithdrawTransactionManual]: recover update company bank credit balance successfully ✅');
    }
    throw LError(`[WithdrawTransactionUsecase.actionWithdrawTransactionManual]: unable to action withdraw transaction manual, TRANSACTION_STATUS:${TRANSACTION_STATUS}`, error);
  }
}

async function requestWithdrawTransaction(requestWithdraw: WithdrawRequestDTO): Promise<[Transaction, Error]> {
  try {
    const {
      username: mobileNumber,
      amount,
    } = requestWithdraw;

    const customer = await customerRepo.findCustomerByMobileNumber(mobileNumber);
    if (!customer) {
      return [null, LError('[WebhookTransactionUsecase.requestWithdrawTransaction]: customer not exist')];
    }

    const { balance } = await walletClient.balance(mobileNumber);

    if (balance < amount) {
      return [null, LError('[WebhookTransactionUsecase.requestWithdrawTransaction]: credit not enough to request withdraw')];
    }

    const {
      bankAccountName: recipientBankName,
      bankAccountNumber: recipientBankAccountNumber,
      customerId,
    } = customer;

    const [hash, transactionAt] = generateHashTransaction(customer.bankAccountNumber, mobileNumber, amount);

    await queue.produceWithdrawJob({
      username: mobileNumber,
      amount,
      hash,
    });

    const result = await transactionRepo.saveTransaction({
      transactionType: TransactionTypeConstant.REQUEST_WITHDRAW,
      status: TransactionStatusConstant.SUCCESS,

      transactionTimestamp: transactionAt,

      mobileNumber,
      customerId,
      recipientBankAccountNumber,
      recipientBankName,

      hash,
      amount,
    });

    return [result, null];
  } catch (error) {
    throw LError('[WithdrawTransactionUsecase.requestWithdrawTransaction]: unable to request withdraw transaction', error);
  }
}

async function cancelRequestWithdrawTransaction(transactionId: string): Promise<void> {
  try {
    const transaction = await transactionRepo.findTransactionByTransactionID(transactionId);
    if (!transaction) {
      throw LError('[WebhookTransactionUsecase.cancelRequestWithdrawTransaction]: transaction not exist');
    }
    if (transaction.transactionType !== TransactionTypeConstant.REQUEST_WITHDRAW) {
      throw LError('[WebhookTransactionUsecase.cancelRequestWithdrawTransaction]: transaction not request withdraw');
    }
    if (transaction.status === TransactionStatusConstant.CANCEL) {
      throw LError('[WebhookTransactionUsecase.cancelRequestWithdrawTransaction]: transaction canceled');
    }

    const { recipientBankAccountNumber, mobileNumber, amount } = transaction;
    const [hash] = generateHashTransaction(recipientBankAccountNumber, mobileNumber, amount);

    await transactionRepo.cancelRequestWithdrawTransaction(transactionId);

    await queue.produceDepositJob({
      username: mobileNumber,
      amount,
      hash,
    });
  } catch (error) {
    throw LError(`[WebhookTransactionUsecase.cancelRequestWithdrawTransaction]: unable to cancel request withdraw transaction, transactionId:${transactionId}`);
  }
}

async function listWithdrawTransaction(withdrawType: WithdrawType, filters: WithdrawListFilterDTO): WithdrawListResponse {
  try {
    const customers = await customerRepo.findAllCustomer({});
    if (customers.length === 0) {
      throw LError('[WebhookTransactionUsecase.listWithdrawTransaction]: no customer exists, please contact to super admin');
    }

    const admins = await adminRepo.findAllAdmin();
    if (admins.length === 0) {
      throw LError('[WebhookTransactionUsecase.listWithdrawTransaction]: no admin exists, please contact to super admin');
    }

    const transactions = await transactionRepo.findAllTransactionByType(filters, withdrawType);

    const result = findTransactionDetails(customers, admins, transactions, filters);

    return result;
  } catch (error) {
    throw LError(`[WithdrawTransactionUsecase.listWithdrawTransaction]: unable to find all withdraw transaction, withdraw type:${withdrawType}`, error);
  }
}

async function listWithdrawTransactionForCustomer(withdrawType: WithdrawType, filters: WithdrawListFilterDTO): WithdrawListResponse {
  try {
    const customers = await customerRepo.findAllCustomer({});
    if (customers.length === 0) {
      throw LError('[WebhookTransactionUsecase.listWithdrawTransaction]: no customer exists, please contact to super admin');
    }

    const admins = await adminRepo.findAllAdmin();
    if (admins.length === 0) {
      throw LError('[WebhookTransactionUsecase.listWithdrawTransaction]: no admin exists, please contact to super admin');
    }

    const transactions = await transactionRepo.findAllTransactionByType(filters, withdrawType, {
      transactionId: 1, amount: 1, transactionTimestamp: 1, status: 1,
    });

    const result = findTransactionDetails(customers, admins, transactions, filters);

    return result;
  } catch (error) {
    throw LError(`[WithdrawTransactionUsecase.listWithdrawTransaction]: unable to find all withdraw transaction, withdraw type:${withdrawType}`, error);
  }
}

async function uploadPayslipWithdraw(stream: any, adminId: string): Promise<string> {
  try {
    const [payslipUploader, objectURL] = awsAdapter.s3().payslipUploader(adminId);
    const { writeStream, promise } = awsAdapter.s3().uploadSteam(payslipUploader);

    stream.pipe(writeStream);

    await promise;

    return objectURL;
  } catch (error) {
    throw LError('[WithdrawTransactionUsecase.uploadPayslipWithdraw]: an error occurred during upload', error);
  }
}

export default {
  actionWithdrawTransactionAutomatic,
  actionWithdrawTransactionManual,
  requestWithdrawTransaction,
  cancelRequestWithdrawTransaction,
  listWithdrawTransaction,
  listWithdrawTransactionForCustomer,
  uploadPayslipWithdraw,
};
