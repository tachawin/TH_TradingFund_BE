/* eslint-disable no-use-before-define */
import { model, Model, FilterQuery } from 'mongoose';
import config from '../config/config';

import { CustomerLevelListFilter, CustomerLevelListFilterDTO, UpdateLevelDTO } from '../entities/dtos/customer_level.dtos';
import {
  CustomerLevel,
  CustomerLevelDocument,
  CustomerLevelSchema,
  CustomerLevelResponse,
  CustomerLevelListResponse,
  CustomerLevelStatusConstant,
} from '../entities/schemas/customer_level.schema';

import { LError } from '../helper/errors.handler';
import { timeFilterToDateTHTimeZoneCeil, timeFilterToDateTHTimeZoneFloor } from '../helper/time.handler';

class CustomerLevelRepository {
  private static instance: CustomerLevelRepository;
  private _model: Model<CustomerLevelDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.level;
    this._model = model<CustomerLevelDocument>(this.collection, CustomerLevelSchema);
  }

  public static getInstance(): CustomerLevelRepository {
    if (!CustomerLevelRepository.instance) {
      CustomerLevelRepository.instance = new CustomerLevelRepository();
    }

    return CustomerLevelRepository.instance;
  }

  public async createLevel(level: CustomerLevel): CustomerLevelResponse {
    const mongooseModel = new this._model(level);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[CustomerLevelRepository.createLevel]: unable to save level to database', error);
    }
  }

  public async findAllLevel(listFilters?: CustomerLevelListFilterDTO, fields?: { [key: string]: number }): CustomerLevelListResponse {
    let query: FilterQuery<CustomerLevelDocument> = {};

    try {
      const {
        startCreated,
        endCreated,
        startUpdated,
        endUpdated,
        minMinimumDepositAmount,
        maxMinimumDepositAmount,
        minMaximumDepositAmount,
        maxMaximumDepositAmount,
        minInvestment,
        maxInvestment,
        minCashback,
        maxCashback,
        keyword,
        sortField,
        sortDirection,
      } = listFilters || {};

      const filters: CustomerLevelListFilter = {};

      filters.status = { $in: [CustomerLevelStatusConstant.ACTIVE] };

      let search = [];

      const createdFilter: FilterQuery<CustomerLevelDocument> = {};
      if (startCreated) {
        createdFilter.$gte = timeFilterToDateTHTimeZoneFloor(startCreated);
      }

      if (endCreated) {
        createdFilter.$lte = timeFilterToDateTHTimeZoneCeil(endCreated);
      }

      const updatedFilter: FilterQuery<CustomerLevelDocument> = {};
      if (startUpdated) {
        updatedFilter.$gte = timeFilterToDateTHTimeZoneFloor(startUpdated);
      }

      if (endUpdated) {
        updatedFilter.$lte = timeFilterToDateTHTimeZoneCeil(endUpdated);
      }

      const minimumDepositAmountFilter: FilterQuery<CustomerLevelDocument> = {};
      if (minMinimumDepositAmount) {
        minimumDepositAmountFilter.$gte = minMinimumDepositAmount;
      }

      if (maxMinimumDepositAmount) {
        minimumDepositAmountFilter.$lte = maxMinimumDepositAmount;
      }

      const maximumDepositAmountFilter: FilterQuery<CustomerLevelDocument> = {};
      if (minMaximumDepositAmount) {
        maximumDepositAmountFilter.$gte = minMaximumDepositAmount;
      }

      if (maxMaximumDepositAmount) {
        maximumDepositAmountFilter.$lte = maxMaximumDepositAmount;
      }

      const investmentAmountFilter: FilterQuery<CustomerLevelDocument> = {};
      if (minInvestment) {
        investmentAmountFilter.$gte = minInvestment;
      }

      if (maxInvestment) {
        investmentAmountFilter.$lte = maxInvestment;
      }

      const cashbackFilter: FilterQuery<CustomerLevelDocument> = {};
      if (minCashback) {
        cashbackFilter.$gte = minCashback;
      }

      if (maxCashback) {
        cashbackFilter.$lte = maxCashback;
      }

      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        search = [
          { levelName: regex },
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

      const isUpdatedFilterTimeRange = Object.keys(updatedFilter).length !== 0;
      if (isUpdatedFilterTimeRange) {
        multiFilter.push({ updatedAt: updatedFilter });
      }

      const isMinimumDepositAmountFilterRange = Object.keys(minimumDepositAmountFilter).length !== 0;
      if (isMinimumDepositAmountFilterRange) {
        multiFilter.push({ minimumDepositAmount: minimumDepositAmountFilter });
      }

      const isMaximumDepositAmountFilterRange = Object.keys(maximumDepositAmountFilter).length !== 0;
      if (isMaximumDepositAmountFilterRange) {
        multiFilter.push({ maximumDepositAmount: maximumDepositAmountFilter });
      }

      const isInvestmentFilterRange = Object.keys(investmentAmountFilter).length !== 0;
      if (isInvestmentFilterRange) {
        multiFilter.push({ investmentAmount: investmentAmountFilter });
      }

      const isCashbackFilterRange = Object.keys(cashbackFilter).length !== 0;
      if (isCashbackFilterRange) {
        multiFilter.push({ cashback: cashbackFilter });
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

      if (!isMultiFilter && isUpdatedFilterTimeRange) {
        query = { updatedAt: updatedFilter };
      }

      if (!isMultiFilter && isMinimumDepositAmountFilterRange) {
        query = { minimumDepositAmount: minimumDepositAmountFilter };
      }

      if (!isMultiFilter && isMaximumDepositAmountFilterRange) {
        query = { maximumDepositAmount: maximumDepositAmountFilter };
      }

      if (!isMultiFilter && isInvestmentFilterRange) {
        query = { investmentAmount: investmentAmountFilter };
      }

      if (!isMultiFilter && isCashbackFilterRange) {
        query = { cashback: cashbackFilter };
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

      const result = await this._model.find(query, { _id: 0, password: 0, ...fields }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError('[CustomerLevelRepository.findAllLevel]: unable to find all level on database', error);
    }
  }

  public async findLevelByLevelID(levelId: string): CustomerLevelResponse {
    try {
      const query = {
        levelId,
        status: CustomerLevelStatusConstant.ACTIVE,
      };
      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[CustomerLevelRepository.findLevelByLevelID]: unable to find level with the level_id: ${levelId}`, error);
    }
  }

  public async updateLevel(levelId: string, newLevelInfo: UpdateLevelDTO): CustomerLevelResponse {
    try {
      const query = {
        levelId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        newLevelInfo,
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[CustomerLevelRepository.updateLevel]: unable to update level: ${levelId}`, error);
    }
  }

  public async softDeleteLevel(levelId: string): Promise<number> {
    try {
      const query = {
        levelId,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        status: CustomerLevelStatusConstant.DELETED,
      });

      return modifiedCount;
    } catch (error) {
      throw LError(`[CustomerLevelRepository.softDeleteLevel]: unable to delete level: ${levelId}`, error);
    }
  }
}

export default CustomerLevelRepository;
