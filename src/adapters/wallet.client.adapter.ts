import crypto from 'crypto';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import config from '../config/config';

import {
  CreateWalletResponse,
  GetWalletBalanceResponse,
  DepositRequest,
  DepositResponse,
  WithdrawRequest,
  WithdrawResponse,
  SummaryReportRequest,
  SummaryReportResponse,
} from '../entities/dtos/wallet.dtos';

import { LError } from '../helper/errors.handler';
import { toDateTHTimeZoneByDate } from '../helper/time.handler';

class WalletClientAdapter {
  static instance = null;

  private ag_code = config.client.wallet.options.ag_code;
  private secret_key = config.client.wallet.options.secret_key;
  private user_prefix = config.client.wallet.user_prefix;

  private fetcher: AxiosInstance;
  private options: AxiosRequestConfig = {
    baseURL: config.client.wallet.fetcher.base_url,
    headers: {
      common: {
        'Content-Type': 'application/json',
      },
    } as any,
  };

  constructor() {
    this.create();
  }

  static getInstance(): InstanceType<typeof WalletClientAdapter> {
    if (!WalletClientAdapter.instance) {
      WalletClientAdapter.instance = new WalletClientAdapter();
    }

    return WalletClientAdapter.instance;
  }

  private create() {
    this.fetcher = axios.create(this.options);
  }

  private signature(timestamp: number): string {
    const plaintext = `${this.ag_code}${timestamp}${this.secret_key}`;

    return crypto.createHash('md5').update(plaintext).digest('hex');
  }

  private usernameWithPrefix(username: string): string {
    const prefix = this.user_prefix?.th || 'thai';

    return `${prefix}${username}`;
  }

  public async createWallet(username: string): CreateWalletResponse {
    try {
      const ts = Date.now();
      const sign = this.signature(ts);

      const { data } = await this.fetcher.post(
        `/api/cmd/createPlayer?agCode=${this.ag_code}&timestamp=${ts}&signature=${sign}`,
        { username: this.usernameWithPrefix(username) },
      );

      return data;
    } catch (error) {
      throw LError('[WalletClientAdapter.createCustomerWallet]: unable to call create wallet customer to external API', error);
    }
  }

  public async balance(username: string): GetWalletBalanceResponse {
    try {
      const ts = Date.now();
      const sign = this.signature(ts);

      const { data } = await this.fetcher.post(
        `/api/cmd/balance?agCode=${this.ag_code}&timestamp=${ts}&signature=${sign}`,
        { username: this.usernameWithPrefix(username) },
      );

      return data;
    } catch (error) {
      throw LError('[WalletClientAdapter.balance]: unable to call get wallet balance customer to external API', error);
    }
  }

  public async summaryReport(customerInfo: SummaryReportRequest): SummaryReportResponse {
    try {
      const today = toDateTHTimeZoneByDate();
      const dateStart = customerInfo.dateStart || toDateTHTimeZoneByDate(new Date(today.getFullYear(), today.getMonth(), 1)).toISOString().split('T')[0];
      const dateEnd = customerInfo.dateEnd || toDateTHTimeZoneByDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)).toISOString().split('T')[0];
      const type = customerInfo.type || '';

      const ts = Date.now();
      const sign = this.signature(ts);

      const { username } = customerInfo;

      const payload = {
        username: this.usernameWithPrefix(username),
        type,
        dateStart,
        dateEnd,
      };

      const { data } = await this.fetcher.post(
        `/api/cmd/SummaryReport?agCode=${this.ag_code}&timestamp=${ts}&signature=${sign}`,
        payload,
      );

      console.info(`[WalletClientAdapter.summaryReport]: get summat report success with payload, username:${payload.username}, dateStart:${dateStart}, dateEnd:${dateEnd}`);

      return data;
    } catch (error) {
      throw LError('[WalletClientAdapter.summaryReport]: unable to call get wallet summary report specific customer to external API', error);
    }
  }

  public async deposit(transaction: DepositRequest): DepositResponse {
    try {
      const { username } = transaction;

      const ts = Date.now();
      const sign = this.signature(ts);

      console.info(`/api/cmd/deposit?agCode=${this.ag_code}&timestamp=${ts}&signature=${sign}`);

      const { data } = await this.fetcher.post(
        `/api/cmd/deposit?agCode=${this.ag_code}&timestamp=${ts}&signature=${sign}`,
        {
          ...transaction,
          username: this.usernameWithPrefix(username),
        },
      );

      console.info('[WalletClientAdapter.deposit]: deposit response, ', data);

      return data;
    } catch (error) {
      throw LError('[WalletClientAdapter.deposit]: unable to call deposit to external API', error);
    }
  }

  public async withdraw(transaction: WithdrawRequest): WithdrawResponse {
    try {
      const { username } = transaction;

      const ts = Date.now();
      const sign = this.signature(ts);

      const { data } = await this.fetcher.post(
        `/api/cmd/withdraw?agCode=${this.ag_code}&timestamp=${ts}&signature=${sign}`,
        {
          ...transaction,
          username: this.usernameWithPrefix(username),
        },
      );

      console.info('[WalletClientAdapter.withdraw]: withdraw response, ', data);

      return data;
    } catch (error) {
      throw LError('[WalletClientAdapter.withdraw]: unable to call withdraw to external API', error);
    }
  }
}

export default WalletClientAdapter;
