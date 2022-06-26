import { CreditConditionListFilterDTO, UpdateCreditConditionDTO } from '../entities/dtos/credit_condition.dtos';
import { CreditCondition, CreditConditionListResponse, CreditConditionResponse } from '../entities/schemas/credit_condition.schema';

import { LError } from '../helper/errors.handler';

import CreditConditionRepository from '../repositories/credit_condition.repository';

const creditCondition = CreditConditionRepository.getInstance();

async function createCreditCondition(creditConditionInfo: CreditCondition): CreditConditionResponse {
  try {
    const newCreditCondition = await creditCondition.createCreditCondition(creditConditionInfo);

    return newCreditCondition;
  } catch (error) {
    throw LError('[CreditConditionUsecase.createCreditCondition]: unable to create creditCondition', error);
  }
}

async function findCreditConditionList(filters: CreditConditionListFilterDTO): CreditConditionListResponse {
  try {
    const creditConditions = await creditCondition.findAllCreditCondition(filters);

    return creditConditions;
  } catch (error) {
    throw LError('[CreditConditionUsecase.findCreditConditionList]: unable to find all creditCondition', error);
  }
}

async function findCreditConditionByPoint(point: number): CreditConditionResponse {
  try {
    const result = await creditCondition.findCreditConditionByPoint(point);

    return result;
  } catch (error) {
    throw LError('[CreditConditionUsecase.findCreditConditionByPoint]: unable to find creditCondition by point', error);
  }
}

async function updateCreditCondition(creditConditionId: string, newCreditConditionInfo: UpdateCreditConditionDTO): CreditConditionResponse {
  try {
    const updatedCreditCondition = await creditCondition.updateCreditCondition(creditConditionId, newCreditConditionInfo);

    return updatedCreditCondition;
  } catch (error) {
    throw LError('[CreditConditionUsecase.updateCreditCondition]: unable to update creditCondition information', error);
  }
}

async function deleteCreditCondition(creditConditionId: string): Promise<boolean> {
  try {
    const updatedCount = await creditCondition.hardDeleteCreditCondition(creditConditionId);
    if (updatedCount === 0) {
      return false;
    }

    return true;
  } catch (error) {
    throw LError('[CreditConditionUsecase.deleteCreditCondition]: unable to delete creditCondition', error);
  }
}

export default {
  createCreditCondition,
  findCreditConditionList,
  findCreditConditionByPoint,
  updateCreditCondition,
  deleteCreditCondition,
};
