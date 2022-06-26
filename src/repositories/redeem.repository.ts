/* eslint-disable no-use-before-define */
import { model, Model, FilterQuery } from 'mongoose';
import config from '../config/config';
import { UpdateRedeemDTO } from '../entities/dtos/redeem.dtos';
import { RedeemCreditListFilter, RedeemCreditListFilterDTO } from '../entities/dtos/redeem_credit.dtos';
import { RedeemProductListFilter, RedeemProductListFilterDTO } from '../entities/dtos/redeem_product.dtos';

import {
  Redeem,
  RedeemDocument,
  RedeemSchema,
  RedeemResponse,
  RedeemListResponse,
  RedeemStatus,
  RedeemTypeConstant,
} from '../entities/schemas/redeem.schema';

import { LError } from '../helper/errors.handler';
import { timeFilterToDateTHTimeZoneCeil, timeFilterToDateTHTimeZoneFloor } from '../helper/time.handler';

class RedeemRepository {
  private static instance: RedeemRepository;
  private _model: Model<RedeemDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.redeem;
    this._model = model<RedeemDocument>(this.collection, RedeemSchema);
  }

  public static getInstance(): RedeemRepository {
    if (!RedeemRepository.instance) {
      RedeemRepository.instance = new RedeemRepository();
    }

    return RedeemRepository.instance;
  }

  public async createRedeem(redeem: Redeem): RedeemResponse {
    const mongooseModel = new this._model(redeem);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[RedeemRepository.createRedeem]: unable to save redeem to database', error);
    }
  }

  public async findAllCreditRedeemList(listFilters: RedeemCreditListFilterDTO): RedeemListResponse {
    let query: FilterQuery<RedeemDocument> = {};

    try {
      const {
        customerId,
        startCreated,
        endCreated,
        minCredit,
        maxCredit,
        minPoint,
        maxPoint,
        status,
        keyword,
        sortField,
        sortDirection,
      } = listFilters;

      const filters: RedeemCreditListFilter = { redeemType: RedeemTypeConstant.CREDIT };

      let search = [];

      if (customerId) {
        filters.customerId = customerId;
      }

      const createdFilter: FilterQuery<RedeemDocument> = {};
      if (startCreated) {
        createdFilter.$gte = timeFilterToDateTHTimeZoneFloor(startCreated);
      }

      if (endCreated) {
        createdFilter.$lte = timeFilterToDateTHTimeZoneCeil(endCreated);
      }

      const creditFilter: FilterQuery<RedeemDocument> = {};
      if (minCredit) {
        creditFilter.$gte = minCredit;
      }

      if (maxCredit) {
        creditFilter.$lte = maxCredit;
      }

      const pointFilter: FilterQuery<RedeemDocument> = {};
      if (minPoint) {
        pointFilter.$gte = minPoint;
      }

      if (maxPoint) {
        pointFilter.$lte = maxPoint;
      }

      if (status?.length > 0 && typeof status !== 'string') {
        filters.status = {
          $in: status,
        };
      }

      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        search = [
          { mobileNumber: regex },
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

      const creditFilterRange = Object.keys(creditFilter).length !== 0;
      if (creditFilterRange) {
        multiFilter.push({ credit: creditFilter });
      }

      const pointFilterRange = Object.keys(pointFilter).length !== 0;
      if (pointFilterRange) {
        multiFilter.push({ point: pointFilter });
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

      if (!isMultiFilter && creditFilterRange) {
        query = { credit: creditFilter };
      }

      if (!isMultiFilter && pointFilterRange) {
        query = { point: pointFilter };
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

     // console.log(query, sortOptions);

      const result = await this._model.find(query, { _id: 0, password: 0 }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError(`[RedeemRepository.findAllCreditRedeem]: unable to find all credit redeem on database with query:${query}`, error);
    }
  }

  public async findAllProductRedeemList(listFilters: RedeemProductListFilterDTO): RedeemListResponse {
    let query: FilterQuery<RedeemDocument> = {};

    try {
      const {
        customerId,
        startCreated,
        endCreated,
        minPoint,
        maxPoint,
        status,
        keyword,
        sortField,
        sortDirection,
      } = listFilters;

      const filters: RedeemProductListFilter = { redeemType: RedeemTypeConstant.PRODUCT };

      let search = [];

      if (customerId) {
        filters.customerId = customerId;
      }

      const createdFilter: FilterQuery<RedeemDocument> = {};
      if (startCreated) {
        createdFilter.$gte = timeFilterToDateTHTimeZoneFloor(startCreated);
      }

      if (endCreated) {
        createdFilter.$lte = timeFilterToDateTHTimeZoneCeil(endCreated);
      }

      const pointFilter: FilterQuery<RedeemDocument> = {};
      if (minPoint) {
        pointFilter.$gte = minPoint;
      }

      if (maxPoint) {
        pointFilter.$lte = maxPoint;
      }

      if (status?.length > 0 && typeof status !== 'string') {
        filters.status = {
          $in: status,
        };
      }

      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        search = [
          { mobileNumber: regex },
          { address: regex },
          { notes: regex },
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

      const pointFilterRange = Object.keys(pointFilter).length !== 0;
      if (pointFilterRange) {
        multiFilter.push({ point: pointFilter });
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

      if (!isMultiFilter && pointFilterRange) {
        query = { point: pointFilter };
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

     // console.log(query, sortOptions);

      const result = await this._model.find(query, { _id: 0, password: 0 }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError(`[RedeemRepository.findAllProductRedeemList]: unable to find product redeem list on database with query:${query}`, error);
    }
  }

  public async findRedeemByRedeemID(redeemId: string): RedeemResponse {
    try {
      const query = { redeemId };
      const { _doc: result } = await this._model.findOne(query, { _id: 0 }) as any;

      return result;
    } catch (error) {
      throw LError(`[RedeemRepository.findRedeemByRedeemID]: unable to find redeem with the redeem_id: ${redeemId}`, error);
    }
  }

  public async updateRedeemStatus(redeemId: string, newStatus: RedeemStatus): RedeemResponse {
    try {
      const query = {
        redeemId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        { status: newStatus },
        {
          new: true,
          fields: { _id: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[RedeemRepository.updateRedeemStatus]: unable to update redeem status: ${redeemId}`, error);
    }
  }

  public async updateRedeem(redeemId: string, newRedeemInfo: UpdateRedeemDTO): RedeemResponse {
    try {
      const query = {
        redeemId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        newRedeemInfo,
        {
          new: true,
          fields: { _id: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[RedeemRepository.updateRedeem]: unable to update redeem: ${redeemId}`, error);
    }
  }
}

export default RedeemRepository;
