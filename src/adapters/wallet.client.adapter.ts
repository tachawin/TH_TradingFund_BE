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
} from '../entities/dtos/wallet.dtos';

import { LError } from '../helper/errors.handler';

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

  public async deposit(transaction: DepositRequest): DepositResponse {
    try {
      const { username } = transaction;

      const ts = Date.now();
      const sign = this.signature(ts);

      console.log(`/api/cmd/deposit?agCode=${this.ag_code}&timestamp=${ts}&signature=${sign}`);

      const { data } = await this.fetcher.post(
        `/api/cmd/deposidt?agCode=${this.ag_code}&timestamp=${ts}&signature=${sign}`,
        {
          ...transaction,
          username: this.usernameWithPrefix(username),
        },
      );

      console.log('[WalletClientAdapter.deposit]: deposit response, ', data);

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

      console.log('[WalletClientAdapter.withdraw]: withdraw response, ', data);

      return data;
    } catch (error) {
      throw LError('[WalletClientAdapter.withdraw]: unable to call withdraw to external API', error);
    }
  }
}

export default WalletClientAdapter;
