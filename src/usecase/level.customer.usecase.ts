import AWSAdapter from '../adapters/aws.adapter';

import { CustomerLevelListFilterDTO, UpdateLevelDTO } from '../entities/dtos/customer_level.dtos';
import { CustomerLevel, CustomerLevelResponse } from '../entities/schemas/customer_level.schema';

import { LError } from '../helper/errors.handler';

import CustomerLevelRepository from '../repositories/customer_level.repository';

const awsAdapter = AWSAdapter.getInstance();

const customerLevel = CustomerLevelRepository.getInstance();

async function findLevelList(filters: CustomerLevelListFilterDTO): Promise<CustomerLevel[]> {
  try {
    const levels = await customerLevel.findAllLevel(filters);

    return levels;
  } catch (error) {
    throw LError('[usecase.findLevelList]: unable to find all level', error);
  }
}

async function findLevelListForCustomer(filters: CustomerLevelListFilterDTO): Promise<CustomerLevel[]> {
  try {
    const levels = await customerLevel.findAllLevel(filters, {
      status: 0, createdAt: 0, updatedAt: 0,
    });

    return levels;
  } catch (error) {
    throw LError('[usecase.findLevelList]: unable to find all level', error);
  }
}

async function createLevel(levelInfo: CustomerLevel): CustomerLevelResponse {
  try {
    const newLevel = await customerLevel.createLevel(levelInfo);

    return newLevel;
  } catch (error) {
    throw LError('[usecase.createLevel]: unable to create level', error);
  }
}

async function updateLevel(levelId: string, newLevelInfo: UpdateLevelDTO): CustomerLevelResponse {
  try {
    const updatedLevel = await customerLevel.updateLevel(levelId, newLevelInfo);

    return updatedLevel;
  } catch (error) {
    throw LError('[usecase.updateLevel]: unable to update level information', error);
  }
}

async function deleteLevel(levelId: string): Promise<boolean> {
  try {
    const updatedCount = await customerLevel.softDeleteLevel(levelId);
    if (updatedCount === 0) {
      return false;
    }

    return true;
  } catch (error) {
    throw LError('[usecase.deleteLevel]: unable to delete level', error);
  }
}

async function findLevelByLevelId(levelId: string): Promise<CustomerLevel> {
  try {
    const level = await customerLevel.findLevelByLevelID(levelId);

    return level;
  } catch (error) {
    throw LError(`[usecase.findLevelByLevelId]: unable to find level id: ${levelId}`, error);
  }
}

async function uploadLevelImage(stream: any): Promise<string> {
  try {
    const [levelImageUploader, objectURL] = awsAdapter.s3().levelImageUploader();
    const { writeStream, promise } = awsAdapter.s3().uploadSteam(levelImageUploader);

    stream.pipe(writeStream);

    await promise;

    return objectURL;
  } catch (error) {
    throw LError('[usecase.uploadLevelImage]: an error occurred during upload', error);
  }
}

export default {
  findLevelList,
  findLevelListForCustomer,
  createLevel,
  updateLevel,
  deleteLevel,
  findLevelByLevelId,
  uploadLevelImage,
};
