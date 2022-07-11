/* eslint-disable no-use-before-define */
import { FilterQuery, model, Model } from 'mongoose';

import config from '../config/config';

import { UpdateDepositCustomerDTO } from '../entities/dtos/deposit.transaction.dtos';
import {
  TransactionListFilter,
  TransactionListFilterDTO,
  DashboardAmountTransactionByDayResult,
} from '../entities/dtos/transaction.dtos';
import { MongoMatchFilter } from '../entities/interfaces/helper/mongo.types';
import {
  TransactionDocument,
  TransactionListResponse,
  TransactionResponse,
  TransactionSchema,
  TransactionStatusConstant,
  TransactionTypeConstant,
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/schemas/transaction.schema';

import { LError } from '../helper/errors.handler';
import {
  timeFilterToDateTHTimeZoneCeil,
  timeFilterToDateTHTimeZoneFloor,
  timeFilterToTwelveFormat,
} from '../helper/time.handler';

class TransactionRepository {
  private static instance: TransactionRepository;
  private _model: Model<TransactionDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.transaction;
    this._model = model<TransactionDocument>(this.collection, TransactionSchema);
  }

  public static getInstance(): TransactionRepository {
    if (!TransactionRepository.instance) {
      TransactionRepository.instance = new TransactionRepository();
    }

    return TransactionRepository.instance;
  }

  public async findTransactionByTransactionID(transactionId: string): TransactionResponse {
    try {
      const query = {
        transactionId,
      };
      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[TransactionRepository.findTransactionByTransactionID]: unable to find transaction with the transaction_id: ${transactionId}`, error);
    }
  }

  public async findTransactionByTransactionIDAndType(transactionId: string, transactionType: TransactionType): TransactionResponse {
    try {
      const query = {
        transactionId,
        transactionType,
      };
      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[TransactionRepository.findTransactionByTransactionID]: unable to find transaction with the transaction_id: ${transactionId}`, error);
    }
  }

  public async findTransactionByCustomerMobileNumberAndDate(mobileNumber: string, date: string): TransactionResponse {
    try {
      const gte = timeFilterToDateTHTimeZoneFloor(date);
      const lte = timeFilterToDateTHTimeZoneCeil(date);

      const query = {
        mobileNumber,
        createdAt: {
          $gte: gte,
          $lte: lte,
        },
      };

      console.info(query);
      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError('[TransactionRepository.findTransactionByCustomerMobileNumberAndDate]: unable to find transaction by mobileNumber and date', error);
    }
  }

  public async saveTransaction(transaction: Transaction): TransactionResponse {
    const mongooseModel = new this._model(transaction);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[TransactionRepository.saveDepositTransaction]: unable to save deposit transaction to database', error);
    }
  }

  public async findAllTransactionByType(listFilters: TransactionListFilterDTO, transactionType?: TransactionType | null, fields?: { [key: string]: number }): TransactionListResponse {
    let query: FilterQuery<TransactionDocument> = {};

    try {
      const {
        status,
        bankName,
        customerId,
        companyBankId,
        start,
        end,
        min,
        max,
        keyword,
        sortField,
        sortDirection,
        transactionType: transactionTypeFilter,
      } = listFilters;

      let filters: TransactionListFilter = {};
      if (transactionType) {
        filters = { transactionType };
      }

      if (!transactionType && transactionTypeFilter) {
        let type: TransactionType | MongoMatchFilter<TransactionType> = transactionTypeFilter as TransactionType;

        if (Array.isArray(transactionTypeFilter)) {
          type = { $in: transactionTypeFilter };
        }

        filters.transactionType = type;
      }

      if (customerId) {
        filters.customerId = customerId;
      }

      if (companyBankId) {
        let companyBankFilter: string | MongoMatchFilter<string> = companyBankId as string;

        if (Array.isArray(companyBankId)) {
          companyBankFilter = { $in: companyBankId };
        }

        filters.companyBankId = companyBankFilter;
      }

      filters.status = {
        $in: [
          TransactionStatusConstant.SUCCESS,
          TransactionStatusConstant.NOT_FOUND,
          TransactionStatusConstant.CANCEL,
        ],
      };
      if (status) {
        let statusFilter: TransactionStatus | MongoMatchFilter<TransactionStatus> = status as TransactionStatus;

        if (Array.isArray(statusFilter)) {
          statusFilter = { $in: statusFilter };
        }

        filters.status = statusFilter;
      }

      const transactionDateFilter: FilterQuery<TransactionDocument> = {};
      if (start) {
        transactionDateFilter.$gte = timeFilterToDateTHTimeZoneFloor(start);
      }
      if (end) {
        transactionDateFilter.$lte = timeFilterToDateTHTimeZoneCeil(end);
      }

      const amountFilter: FilterQuery<TransactionDocument> = {};
      if (min) {
        amountFilter.$gte = parseInt(min, 10);
      }
      if (max) {
        amountFilter.$lte = parseInt(max, 10);
      }

      let bankSupportedFilter = [];
      if (bankName?.length > 0) {
        bankSupportedFilter = [
          { payerBankName: { $in: bankName } },
          { recipientBankName: { $in: bankName } },
        ];
      }

      let search = [];
      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        search = [
          { mobileNumber: regex },
          { payerBankAccountNumber: regex },
          { payerBankName: regex },
          { recipientBankAccountNumber: regex },
          { recipientBankName: regex },
          { notes: regex },
        ];
      }

      const multiFilter = [];

      const isFilter = Object.keys(filters).length !== 0;
      if (isFilter) {
        multiFilter.push(filters);
      }

      const isBankSupportedFilter = bankSupportedFilter.length !== 0;
      if (isBankSupportedFilter) {
        multiFilter.push({ $or: bankSupportedFilter });
      }

      const isMultiSearch = search.length !== 0;
      if (isMultiSearch) {
        multiFilter.push({ $or: search });
      }

      const isAmountFilterRange = Object.keys(amountFilter).length !== 0;
      if (isAmountFilterRange) {
        multiFilter.push({ amount: amountFilter });
      }

      const isTransactionDateFilterTimeRange = Object.keys(transactionDateFilter).length !== 0;
      if (isTransactionDateFilterTimeRange) {
        multiFilter.push({ transactionTimestamp: transactionDateFilter });
      }

      const isMultiFilter = multiFilter.length > 1;

      if (!isMultiFilter && isFilter) {
        query = { ...filters };
      }

      if (!isMultiFilter && isBankSupportedFilter) {
        query = { $or: bankSupportedFilter };
      }

      if (!isMultiFilter && isMultiSearch) {
        query = { $or: search };
      }

      if (!isMultiFilter && isAmountFilterRange) {
        query = { amount: amountFilter };
      }

      if (!isMultiFilter && isTransactionDateFilterTimeRange) {
        query = { transactionTimestamp: transactionDateFilter };
      }

      if (isMultiFilter) {
        query = {
          $and: multiFilter,
        };
      }

      let sortOptions = {};
      if (sortField) {
        let direction = -1;

        if (sortDirection === 'asc') {
          direction = 1;
        }

        sortOptions = { [sortField]: direction };
      }

      if (Object.keys(sortOptions).length === 0) {
        sortOptions = { createdAt: -1 };
      }

      // console.info(query, sortOptions);

      const result = await this._model.find(query, { _id: 0, ...fields }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError(`[TransactionRepository.findAllDepositTransaction]: unable to find all deposit transaction on database with query:${query}`, error);
    }
  }

  public async updateNoteDepositTransaction(transactionId: string, notes: string, adminId: string): Promise<number> {
    try {
      const query = {
        transactionId,
        transactionType: TransactionTypeConstant.DEPOSIT,
        status: { $in: [TransactionStatusConstant.SUCCESS, TransactionStatusConstant.CANCEL] },
      };

      const { modifiedCount } = await this._model.updateOne(query, { notes, adminId });

      return modifiedCount;
    } catch (error) {
      throw LError(`[TransactionRepository.updateNoteDepositTransaction]: unable to update note: ${transactionId}`, error);
    }
  }

  public async waiveDepositTransaction(transactionId: string, notes: string, adminId: string): Promise<number> {
    try {
      const query = {
        transactionId,
        transactionType: TransactionTypeConstant.DEPOSIT,
        status: TransactionStatusConstant.SUCCESS,
      };

      const { modifiedCount } = await this._model.updateOne(query, { notes, adminId, status: TransactionStatusConstant.CANCEL });

      return modifiedCount;
    } catch (error) {
      throw LError(`[TransactionRepository.updateNoteDepositTransaction]: unable to update note: ${transactionId}`, error);
    }
  }

  public async updateCustomerDepositTransaction(updateTransaction: UpdateDepositCustomerDTO): Promise<number> {
    try {
      const {
        transactionId,
        ...pickedCustomer
      } = updateTransaction;

      const query = {
        transactionId,
        transactionType: TransactionTypeConstant.DEPOSIT,
        status: TransactionStatusConstant.NOT_FOUND,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        status: TransactionStatusConstant.SUCCESS,
        ...pickedCustomer,
      });

      return modifiedCount;
    } catch (error) {
      throw LError('[TransactionRepository.updateCustomerDepositTransaction]: unable to update customer', error);
    }
  }

  public async countAmountTransactionAtTwelveByDay(twelve: 'am' | 'pm', date: string): Promise<DashboardAmountTransactionByDayResult[]> {
    try {
      const [gte, lte] = timeFilterToTwelveFormat(date, twelve);

      const result = await this._model.aggregate([
        {
          $match: {
            createdAt: { $gte: gte, $lte: lte },
          },
        },
        {
          $group: {
            _id: {
              type: '$transactionType',
            },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]) as any;

      return result;
    } catch (error) {
      throw LError(`[TransactionRepository.countAmountTransactionAtTwelveByDay]: unable to get amount customer register in AM per day at twelve:${twelve}`, error);
    }
  }

  public async updateTransactionStatusByHash(hash: string, status: TransactionStatusConstant): Promise<number> {
    try {
      const query = {
        hash,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        status,
      });

      return modifiedCount;
    } catch (error) {
      throw LError('[TransactionRepository.updateTransactionStatusByHash]: unable to update status transaction', error);
    }
  }

  public async cancelRequestWithdrawTransaction(transactionId: string): Promise<number> {
    try {
      const query = {
        transactionId,
        transactionType: TransactionTypeConstant.REQUEST_WITHDRAW,
        status: TransactionStatusConstant.SUCCESS,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        $set: { transactionType: TransactionTypeConstant.WITHDRAW, status: TransactionStatusConstant.CANCEL },
      });

      return modifiedCount;
    } catch (error) {
      throw LError('[TransactionRepository.updateTransactionStatusByHash]: unable to update status transaction', error);
    }
  }
}

export default TransactionRepository;
