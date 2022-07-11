/* eslint-disable no-return-await */
/* eslint-disable no-new */
/* eslint-disable no-unused-vars */
import { Job, UnrecoverableError } from 'bullmq';

import MongoAdapter from '../adapters/mongo.adapter';
import TransactionClientAdapter from '../adapters/transaction.client.adapter';
import WalletClientAdapter from '../adapters/wallet.client.adapter';

import config from '../config/config';

import { TRANSACTION_STATUS_ACTION } from '../entities/constants/transaction.state';
import { WithdrawRequest, DepositRequest, WithdrawAndWaiveRequest } from '../entities/dtos/wallet.dtos';

import { LError } from '../helper/errors.handler';
import { generateHashTransaction } from '../helper/wallet.helper';

import CompanyBankRepository from '../repositories/company_bank.repository';
import CustomerRepository from '../repositories/customer.repository';

new MongoAdapter();

const walletClient = WalletClientAdapter.getInstance();
const transactionClient = TransactionClientAdapter.getInstance();

const customerRepo = CustomerRepository.getInstance();
const bankCompanyRepo = CompanyBankRepository.getInstance();

const JOB_DEPOSIT_ACTION = config.queue.bullmq.wallet.job.deposit_action;
const JOB_WITHDRAW_ACTION = config.queue.bullmq.wallet.job.withdraw_action;
const JOB_WITHDRAW_AND_WAIVE_ACTION = config.queue.bullmq.wallet.job.withdraw_and_waive_action;

async function depositWallet(payload: DepositRequest):Promise<void> {
  const {
    username,
    amount,
  } = payload;

  let TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.START;

  try {
    await walletClient.deposit(payload);
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.WALLET.DEPOSIT;

    await customerRepo.markLastDepositAmountAndUpdateTotalDepositAmount(username, amount);
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.CUSTOMER.UPDATE.LAST_DEPOSIT;

    console.info('[Processor.depositWallet]: deposit wallet success');
  } catch (error) {
    if (TRANSACTION_STATUS === TRANSACTION_STATUS_ACTION.WALLET.DEPOSIT) {
      await walletClient.withdraw(payload);
      console.info('[Processor.depositWallet]: recover deposit wallet successfully ✅');
    }

    throw LError(`[Processor.depositWallet]: unable to deposit wallet, TRANSACTION_STATUS:${TRANSACTION_STATUS}`, error);
  }
}

async function withdrawWallet(payload: WithdrawRequest): Promise<void> {
  try {
    await walletClient.withdraw(payload);
    console.info('[Processor.withdrawWallet]: withdraw wallet success');
  } catch (error) {
    throw LError('[Processor.withdrawWallet]: unable to withdraw wallet', error);
  }
}

async function withdrawWalletAndWaive(payload: WithdrawAndWaiveRequest): Promise<void> {
  const {
    username,
    hash: transactionHash,

    fromAccount,
    accountTo,
    bankCode,

    amount,
  } = payload;

  let TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.START;

  try {
    const [newHash] = generateHashTransaction(accountTo, username, amount);

    await walletClient.withdraw({
      hash: newHash,
      username,
      amount,
    });
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.WALLET.WITHDRAW;

    const { remainingBalance } = await transactionClient.withdraw({
      fromAccount,
      accountTo,
      bankCode,
      amount,
    });
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.BANK.WITHDRAW;

    await bankCompanyRepo.updateBalanceCompanyBank(fromAccount, remainingBalance);
    TRANSACTION_STATUS = TRANSACTION_STATUS_ACTION.COMPANY.UPDATE.BALANCE;

    console.info('[Processor.withdrawWalletAndWaive]: withdraw wallet success');
  } catch (error) {
    const [hashRecover] = generateHashTransaction(accountTo, username, amount);

    if (TRANSACTION_STATUS === TRANSACTION_STATUS_ACTION.WALLET.WITHDRAW) {
      await walletClient.deposit({
        hash: hashRecover,
        username,
        amount,
      });

      console.info('[Processor.withdrawWalletAndWaive]: recover withdraw wallet successfully ✅');
    }

    if (TRANSACTION_STATUS === TRANSACTION_STATUS_ACTION.BANK.WITHDRAW) {
      await walletClient.deposit({
        hash: hashRecover,
        username,
        amount,
      });

      LError('[Processor.withdrawWalletAndWaive]: ****URGENT ERROR: have to deposit manual, recover customer credit and wallet successfully');
      console.info('[Processor.withdrawWalletAndWaive]: recover withdraw wallet and update customer credit successfully ✅');
    }

    throw LError(`[Processor.withdrawWalletAndWaive]: unable to withdraw wallet for waiving transaction, targetTransactionHash:${transactionHash}, TRANSACTION_STATUS:${TRANSACTION_STATUS}`, error);
  }
}

export async function WalletProcessor(job: Job) {
  try {
    const { name, id, data: payload } = job;
    switch (name) {
      case JOB_DEPOSIT_ACTION:
        return await depositWallet(payload);
      case JOB_WITHDRAW_ACTION:
        return await withdrawWallet(payload);
      case JOB_WITHDRAW_AND_WAIVE_ACTION:
        return await withdrawWalletAndWaive(payload);
      default: {
        throw LError(`[Worker.WithdrawProcessor]: job type not supported, jobName:${name}, jobId:${id}`, new UnrecoverableError('unrecoverable'));
      }
    }
  } catch (error) {
    return Promise.reject(LError('[Worker.WithdrawProcessor]: unable to action wallet', error));
  }
}
