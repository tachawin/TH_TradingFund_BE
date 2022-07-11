/* eslint-disable no-use-before-define */
import { model, Model, FilterQuery } from 'mongoose';

import config from '../config/config';

import { CompanyBankListFilter, CompanyBankListFilterDTO, UpdateCompanyBankDTO } from '../entities/dtos/company_bank.dtos';
import {
  CompanyBank,
  CompanyBankDocument,
  CompanyBankSchema,
  CompanyBankResponse,
  COMPANY_BANK_STATUS,
  CompanyBankListResponse,
} from '../entities/schemas/company_bank.schema';

import { LError } from '../helper/errors.handler';
import { timeFilterToDateTHTimeZoneCeil, timeFilterToDateTHTimeZoneFloor } from '../helper/time.handler';

class CompanyBankRepository {
  private static instance: CompanyBankRepository;
  private _model: Model<CompanyBankDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.bank;
    this._model = model<CompanyBankDocument>(this.collection, CompanyBankSchema);
  }

  public static getInstance(): CompanyBankRepository {
    if (!CompanyBankRepository.instance) {
      CompanyBankRepository.instance = new CompanyBankRepository();
    }

    return CompanyBankRepository.instance;
  }

  public async createCompanyBank(admin: CompanyBank): CompanyBankResponse {
    const mongooseModel = new this._model(admin);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[CompanyBankRepository.createCompanyBank]: unable to save bank to database', error);
    }
  }

  public async findAllCompanyBank(listFilters: CompanyBankListFilterDTO): CompanyBankListResponse {
    let query: FilterQuery<CompanyBankDocument> = {};

    try {
      const {
        type,
        bank,
        status,
        startCreated,
        endCreated,
        keyword,
        sortField,
        sortDirection,
      } = listFilters;

      const filters: CompanyBankListFilter = {};

      let search = [];

      filters.status = { $in: [COMPANY_BANK_STATUS.ACTIVE, COMPANY_BANK_STATUS.INACTIVE] };

      if (type?.length > 0 && typeof type !== 'string') {
        filters.type = {
          $in: type,
        };
      }

      if (bank?.length > 0 && typeof bank !== 'string') {
        filters.bankName = {
          $in: bank,
        };
      }

      if (status?.length > 0 && typeof status !== 'string') {
        filters.status = {
          $in: status,
        };
      }

      const createdFilter: FilterQuery<CompanyBankDocument> = {};
      if (startCreated) {
        createdFilter.$gte = timeFilterToDateTHTimeZoneFloor(startCreated);
      }

      if (endCreated) {
        createdFilter.$lte = timeFilterToDateTHTimeZoneCeil(endCreated);
      }

      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        search = [
          { bankAccountName: regex },
          { bankAccountNumber: regex },
          { bankName: regex },
        ];
      }

      const multiFilter = [];

      const isFilter = Object.keys(filters).length !== 0;
      if (isFilter) {
        multiFilter.push(filters);
      }

      const isMultiSearch = search.length !== 0;
      if (isMultiSearch) {
        multiFilter.push({ $or: search });
      }

      const isCreatedFilterTimeRange = Object.keys(createdFilter).length !== 0;
      if (isCreatedFilterTimeRange) {
        multiFilter.push({ createdAt: createdFilter });
      }

      const isMultiFilter = multiFilter.length > 1;

      if (!isMultiFilter && isFilter) {
        query = { ...filters };
      }

      if (!isMultiFilter && isMultiSearch) {
        query = { $or: search };
      }

      if (!isMultiFilter && isCreatedFilterTimeRange) {
        query = { createdAt: createdFilter };
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

      console.log(query, sortOptions);

      const result = await this._model.find(query, { _id: 0, password: 0 }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError(`[AdminRepository.findAllCompanyBank]: unable to find all company bank on database with query:${query}`, error);
    }
  }

  public async findCompanyBankByCompanyBankID(bankId: string): CompanyBankResponse {
    try {
      const query = {
        bankId,
      };
      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[CompanyBankRepository.findCompanyBankByCompanyBankID]: unable to find bank with the bank_id: ${bankId}`, error);
    }
  }

  public async findCompanyBankByBankAccountNumber(bankAccountNumber: string): CompanyBankResponse {
    try {
      const query = {
        bankAccountNumber,
      };
      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[CompanyBankRepository.findCompanyBankByBankAccountNumber]: unable to find company bank with the bank account number: ${bankAccountNumber}`, error);
    }
  }

  public async updateCompanyBank(bankId: string, newCompanyBankInfo: UpdateCompanyBankDTO): CompanyBankResponse {
    try {
      const query = {
        bankId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        newCompanyBankInfo,
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[CompanyBankRepository.softDeleteCompanyBank]: unable to update bank: ${bankId}`, error);
    }
  }

  public async softDeleteCompanyBank(bankId: string): Promise<number> {
    try {
      const query = {
        bankId,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        status: COMPANY_BANK_STATUS.DELETED,
      });

      return modifiedCount;
    } catch (error) {
      throw LError(`[CompanyBankRepository.softDeleteCompanyBank]: unable to delete bank: ${bankId}`, error);
    }
  }

  public async updateBalanceCompanyBank(bankAccountNumber: string, amount: number): CompanyBankResponse {
    try {
      const query = {
        bankAccountNumber,
      };

      const result = await this._model.findOneAndUpdate(query, {
        balance: amount,
      });

      return result;
    } catch (error) {
      throw LError(`[CompanyBankRepository.updateBalanceCompanyBank]: unable to update balance by bankAccountNumber:${bankAccountNumber}, amount:${amount}`, error);
    }
  }

  public async increaseBalanceCompanyBank(bankAccountNumber: string, amount: number): CompanyBankResponse {
    try {
      const query = {
        bankAccountNumber,
      };

      const result = await this._model.findOneAndUpdate(query, {
        $inc: { balance: amount },
      });

      return result;
    } catch (error) {
      throw LError(`[CompanyBankRepository.increaseBalanceCompanyBank]: unable to increase balance by bankAccountNumber:${bankAccountNumber}, amount:${amount}`, error);
    }
  }

  public async decreaseBalanceCompanyBank(bankAccountNumber: string, amount: number): CompanyBankResponse {
    try {
      const query = {
        bankAccountNumber,
      };

      if (amount < 0) {
        throw LError('[CompanyBankRepository.decreaseBalanceCompanyBank]: unable to decrease balance with minus value');
      }

      const result = await this._model.findOneAndUpdate(query, {
        $inc: { balance: amount * -1 },
      });

      return result;
    } catch (error) {
      throw LError(`[CompanyBankRepository.decreaseBalanceCompanyBank]: unable to increase balance by bankAccountNumber:${bankAccountNumber}, amount:${amount}`, error);
    }
  }
}

export default CompanyBankRepository;
