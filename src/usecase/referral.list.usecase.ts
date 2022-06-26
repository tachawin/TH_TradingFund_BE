import { ReferralListWithProfitResponse } from '../entities/dtos/referral_list.dtos';
import { ReferralListResponse } from '../entities/schemas/referral_list.schema';

import { LError } from '../helper/errors.handler';
import { hideMobileNumber } from '../helper/mobileNumber.helper';

import ReferralListRepository from '../repositories/referral_list.repository';

const referralListRepo = ReferralListRepository.getInstance();

async function newReferralList(customerId: string, parentCustomerId?: string): ReferralListResponse {
  try {
    const referralList = await referralListRepo.saveReferralList(customerId, parentCustomerId);

    return referralList;
  } catch (error) {
    throw LError('[ReferralListUsecase.newReferralList]: unable to new referral list', error);
  }
}

async function updateRelatedReferralList(parentId: string, childMobileNumber
: string) {
  try {
    const parentReferralList = await referralListRepo.getReferralListById(parentId);

    if (parentReferralList) {
      referralListRepo.updateReferralList(parentId, childMobileNumber, 1);

      if (parentReferralList.parentCustomerId) {
        referralListRepo.updateReferralList(parentReferralList.parentCustomerId, childMobileNumber, 2);
      }
    }
  } catch (error) {
    throw LError(`[ReferralListUsecase.updateRelatedReferralList]: unable to update referral list related to id: ${parentId}`, error);
  }
}

async function getReferralListById(customerId: string): Promise<ReferralListWithProfitResponse> {
  try {
    const referralList = await referralListRepo.getReferralListById(customerId);
    // Mocking turnover value first
    const firstReferralListWithTurnover = referralList.firstReferralList.map((mobileNumber) => (
      {
        mobileNumber: hideMobileNumber(mobileNumber),
        profit: 1000,
      }));

    const secondReferralListWithTurnover = referralList.secondReferralList.map((mobileNumber) => (
      {
        mobileNumber: hideMobileNumber(mobileNumber),
        profit: 1000,
      }));

    return {
      customerId: referralList.customerId,
      firstReferralList: firstReferralListWithTurnover,
      secondReferralList: secondReferralListWithTurnover,
    };
  } catch (error) {
    throw LError(`[ReferralListUsecase.getReferralListById]: unable to get referral list with id: ${customerId}`, error);
  }
}

export default {
  newReferralList,
  updateRelatedReferralList,
  getReferralListById,
};
