/* eslint-disable no-use-before-define */
import { model, Model, FilterQuery } from 'mongoose';
import config from '../config/config';

import { CreditConditionListFilter, CreditConditionListFilterDTO, UpdateCreditConditionDTO } from '../entities/dtos/credit_condition.dtos';
import {
  CreditCondition,
  CreditConditionDocument,
  CreditConditionSchema,
  CreditConditionResponse,
  CreditConditionListResponse,
  CreditConditionStatusConstant,
} from '../entities/schemas/credit_condition.schema';

import { LError } from '../helper/errors.handler';

class CreditConditionRepository {
  private static instance: CreditConditionRepository;
  private _model: Model<CreditConditionDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.credit_condition;
    this._model = model<CreditConditionDocument>(this.collection, CreditConditionSchema);
  }

  public static getInstance(): CreditConditionRepository {
    if (!CreditConditionRepository.instance) {
      CreditConditionRepository.instance = new CreditConditionRepository();
    }

    return CreditConditionRepository.instance;
  }

  public async createCreditCondition(creditCondition: CreditCondition): CreditConditionResponse {
    const mongooseModel = new this._model(creditCondition);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[CreditConditionRepository.createCreditCondition]: unable to save credit condition to database', error);
    }
  }

  public async findAllCreditCondition(listFilters?: CreditConditionListFilterDTO, fields?: { [key: string]: number }): CreditConditionListResponse {
    let query: FilterQuery<CreditConditionDocument> = {};

    try {
      const {
        minPoint,
        maxPoint,
        minCredit,
        maxCredit,
        minQuantity,
        maxQuantity,
        sortField,
        sortDirection,
      } = listFilters || {};

      const filters: CreditConditionListFilter = {};

      filters.status = { $in: [CreditConditionStatusConstant.ACTIVE] };

      const pointFilter: FilterQuery<CreditConditionDocument> = {};
      if (minPoint) {
        pointFilter.$gte = minPoint;
      }

      if (maxPoint) {
        pointFilter.$lte = maxPoint;
      }

      const creditFilter: FilterQuery<CreditConditionDocument> = {};
      if (minCredit) {
        creditFilter.$gte = minCredit;
      }

      if (maxCredit) {
        creditFilter.$lte = maxCredit;
      }

      const quantityFilter: FilterQuery<CreditConditionDocument> = {};
      if (minQuantity) {
        quantityFilter.$gte = minQuantity;
      }

      if (maxQuantity) {
        quantityFilter.$lte = maxQuantity;
      }

      const multiFilter = [];

      const isFilter = Object.keys(filters).length !== 0;
      if (isFilter) {
        multiFilter.push(filters);
      }

      const pointFilterRange = Object.keys(pointFilter).length !== 0;
      if (pointFilterRange) {
        multiFilter.push({ point: pointFilter });
      }

      const creditFilterRange = Object.keys(creditFilter).length !== 0;
      if (creditFilterRange) {
        multiFilter.push({ credit: creditFilter });
      }

      const quantityFilterRange = Object.keys(quantityFilter).length !== 0;
      if (quantityFilterRange) {
        multiFilter.push({ quantity: quantityFilter });
      }

      const isMultiFilter = multiFilter.length > 1;

      if (!isMultiFilter && isFilter) {
        query = { ...filters };
      }

      if (!isMultiFilter && pointFilterRange) {
        query = { point: pointFilter };
      }

      if (!isMultiFilter && creditFilterRange) {
        query = { credit: creditFilter };
      }

      if (!isMultiFilter && quantityFilterRange) {
        query = { quantity: quantityFilter };
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

      console.info(query, sortOptions);

      const result = await this._model.find(query, { _id: 0, ...fields }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError('[CreditConditionRepository.findAllCreditCondition]: unable to find all credit condition on database', error);
    }
  }

  public async findCreditConditionByPoint(point: number): CreditConditionResponse {
    try {
      const query = {
        point,
      };
      const result = await this._model.findOne(query, { _id: 0 }) as any;

      return result;
    } catch (error) {
      throw LError(`[CreditConditionRepository.findCreditConditionByPoint]: unable to find credit condition with point: ${point}`, error);
    }
  }

  public async updateCreditCondition(conditionId: string, newCreditConditionInfo: UpdateCreditConditionDTO): CreditConditionResponse {
    try {
      const query = {
        conditionId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        newCreditConditionInfo,
        {
          new: true,
          fields: { _id: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[CreditConditionRepository.updateCreditCondition]: unable to update credit condition: ${conditionId}`, error);
    }
  }

  public async decreaseCreditConditionQuantity(conditionId: string, amount: number): CreditConditionResponse {
    try {
      const query = {
        conditionId,
      };

      const result = await this._model.findOneAndUpdate(query, {
        $inc: { quantity: amount * -1 },
      });

      return result;
    } catch (error) {
      throw LError(`[CreditConditionRepository.decreaseCreditConditionQuantity]: unable to decrease quantity by conditionId:${conditionId}, amount:${amount}`, error);
    }
  }

  public async softDeleteCreditCondition(conditionId: string): Promise<number> {
    try {
      const query = {
        conditionId,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        status: CreditConditionStatusConstant.DELETED,
      });

      return modifiedCount;
    } catch (error) {
      throw LError(`[CreditConditionRepository.softDeleteCreditCondition]: unable to delete credit condition: ${conditionId}`, error);
    }
  }

  public async hardDeleteCreditCondition(conditionId: string): Promise<number> {
    try {
      const query = {
        conditionId,
      };

      const { deletedCount } = await this._model.deleteOne(query);

      return deletedCount;
    } catch (error) {
      throw LError(`[CreditConditionRepository.hardDeleteCreditCondition]: unable to delete credit condition: ${conditionId}`, error);
    }
  }
}

export default CreditConditionRepository;
