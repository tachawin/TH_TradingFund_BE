import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import config from '../config/config';

import { WithdrawExternalActionBody, WithdrawExternalActionResponse } from '../entities/dtos/transaction.dtos';

import { LError } from '../helper/errors.handler';

class TransactionClientAdapter {
  static instance = null;

  private header_api_key_name = config.client.transaction.fetcher.headers.api_key.key;
  private header_api_key_value = config.client.transaction.fetcher.headers.api_key.value;

  private fetcher: AxiosInstance;
  private options: AxiosRequestConfig = {
    baseURL: config.client.transaction.fetcher.base_url,
    headers: {
      common: {
        'Content-Type': 'application/json',
        [this.header_api_key_name]: this.header_api_key_value,
      },
    } as any,
  };

  constructor() {
    this.create();
  }

  static getInstance(): InstanceType<typeof TransactionClientAdapter> {
    if (!TransactionClientAdapter.instance) {
      TransactionClientAdapter.instance = new TransactionClientAdapter();
    }

    return TransactionClientAdapter.instance;
  }

  private create() {
    this.fetcher = axios.create(this.options);
  }

  public async withdraw(transaction: WithdrawExternalActionBody): WithdrawExternalActionResponse {
    try {
      const { data } = await this.fetcher.post('/api/system/bank/scb/withdraw', transaction);

      console.info('[TransactionClientAdapter.withdraw]: withdraw transaction response, ', data);
      return data;
    } catch (error) {
      console.info(error);
      throw LError('[TransactionClientAdapter.withdraw]: unable to call withdraw to external API', error);
    }
  }
}

export default TransactionClientAdapter;
