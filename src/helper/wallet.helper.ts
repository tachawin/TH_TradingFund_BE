import crypto from 'crypto';

import config from '../config/config';

import { toDateTHTimeZoneByDate } from './time.handler';

const API_KEY = config.client.transaction.fetcher.headers.api_key.value;

export function generateHashTransaction(bankAccountNumber: string, mobileNumber: string, amount: number): [string, Date] {
  const transactionAt = toDateTHTimeZoneByDate();

  const plaintext = `${transactionAt}${bankAccountNumber}${mobileNumber}${amount}${API_KEY}`;

  return [crypto.createHash('md5').update(plaintext).digest('hex'), transactionAt];
}

export function generateHashCashback(mobileNumber: string, dateStart: string, dateEnd: string): string {
  const plaintext = `${mobileNumber}${dateStart}${dateEnd}`;

  return crypto.createHash('md5').update(plaintext).digest('hex');
}
