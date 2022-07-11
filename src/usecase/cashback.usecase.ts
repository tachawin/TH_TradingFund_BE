import WalletClientAdapter from '../adapters/wallet.client.adapter';
import { CashbackHistoryListResponse } from '../entities/schemas/cashback.history.schema';

import { LError } from '../helper/errors.handler';
import CashbackHistoryRepository from '../repositories/cashback.history.repository';

const walletClient = WalletClientAdapter.getInstance();

const cashbackRepo = CashbackHistoryRepository.getInstance();

async function currentCashback(mobileNumber: string): Promise<number> {
  try {
    const { cashback } = await walletClient.summaryReport({
      username: mobileNumber,
    });

    return cashback;
  } catch (error) {
    throw LError('[CashbackUsecase.currentCashback]: unable to get summary report', error);
  }
}

async function cashbackHistory(mobileNumber: string): CashbackHistoryListResponse {
  try {
    const result = await cashbackRepo.findAllCashbackCustomerHistory(mobileNumber);

    return result;
  } catch (error) {
    throw LError('[CashbackUsecase.cashbackHistory]: unable to get all cashback history', error);
  }
}

export default {
  currentCashback,
  cashbackHistory,
};
