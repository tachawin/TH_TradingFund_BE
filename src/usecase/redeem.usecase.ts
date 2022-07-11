import BullMQAdapter from '../adapters/bullmq.adapter';

import { UpdateRedeemDTO } from '../entities/dtos/redeem.dtos';
import { RedeemCreditBodyRequest, RedeemCreditListFilterDTO } from '../entities/dtos/redeem_credit.dtos';
import { RedeemProductBodyRequest, RedeemProductListFilterDTO } from '../entities/dtos/redeem_product.dtos';
import {
  Redeem,
  RedeemStatus,
  RedeemStatusConstant,
  RedeemTypeConstant,
  RedeemResult,
} from '../entities/schemas/redeem.schema';

import { LError } from '../helper/errors.handler';
import { generateHashTransaction } from '../helper/wallet.helper';

import AdminRepository from '../repositories/admin.repository';
import CreditConditionRepository from '../repositories/credit_condition.repository';
import CustomerRepository from '../repositories/customer.repository';
import ProductRepository from '../repositories/product.repository';
import RedeemRepository from '../repositories/redeem.repository';

const queue = BullMQAdapter.getInstance();

const redeemRepo = RedeemRepository.getInstance();
const creditConditionRepo = CreditConditionRepository.getInstance();
const customerRepo = CustomerRepository.getInstance();
const productRepo = ProductRepository.getInstance();
const adminRepo = AdminRepository.getInstance();

async function findRedeemCreditList(filters: RedeemCreditListFilterDTO): Promise<Redeem[]> {
  try {
    const redeemCreditLists = await redeemRepo.findAllCreditRedeemList(filters);
    const adminResults = await adminRepo.findAllAdmin();

    const admins = {};
    adminResults.forEach((adminInfo) => {
      const { adminId, name } = adminInfo;
      admins[adminId] = name;
    });

    const results = redeemCreditLists.map((redeemProductInfo) => {
      const { adminId } = redeemProductInfo;
      const redeemProductResults = { ...(redeemProductInfo as any)._doc };
      if (adminId) {
        return { ...redeemProductResults, adminName: admins[adminId] };
      }
      return redeemProductResults;
    });

    return results;
  } catch (error) {
    throw LError('[usecase.findRedeemCreditList]: unable to find all credit', error);
  }
}

async function findRedeemProductList(filters: RedeemProductListFilterDTO): Promise<Redeem[]> {
  try {
    const redeemProductLists = await redeemRepo.findAllProductRedeemList(filters);
    const productResults = await productRepo.findAllProduct();
    const adminResults = await adminRepo.findAllAdmin();

    const products = {};
    productResults.forEach((productInfo) => {
      const { productId, name } = productInfo;
      products[productId] = name;
    });

    const admins = {};
    adminResults.forEach((adminInfo) => {
      const { adminId, name } = adminInfo;
      admins[adminId] = name;
    });

    const results = redeemProductLists.map((redeemProductInfo) => {
      const { productId, adminId } = redeemProductInfo;
      const redeemProductResults = { ...(redeemProductInfo as any)._doc, productName: products[productId] };
      if (adminId) {
        return { ...redeemProductResults, adminName: admins[adminId] };
      }
      return redeemProductResults;
    });

    return results;
  } catch (error) {
    throw LError('[usecase.findRedeemProductList]: unable to find all product', error);
  }
}

async function createProductRedeem(customerId: string, mobileNumber: string, redeemInfo: RedeemProductBodyRequest): Promise<[RedeemResult, Error]> {
  try {
    const { productId } = redeemInfo;
    const { point: customerPoint } = await customerRepo.findCustomerByCustomerID(customerId);
    const { quantity, point } = await productRepo.findProductByProductID(productId);

    if (customerPoint < point) {
      return [null, LError('[usecase.createRedeem]: customer points are not enough')];
    }

    if (quantity <= 0) {
      return [null, LError('[usecase.createRedeem]: this product is out of stock')];
    }

    await productRepo.decreaseProductQuantity(productId, 1);
    await customerRepo.decreasePointCustomer(mobileNumber, point);

    const newRedeem = await redeemRepo.createRedeem({
      ...redeemInfo,
      customerId,
      mobileNumber,
      point,
      redeemType: RedeemTypeConstant.PRODUCT,
      status: RedeemStatusConstant.REQUEST,
    });

    return [newRedeem, null];
  } catch (error) {
    throw LError('[usecase.createRedeem]: unable to create redeem', error);
  }
}

async function createCreditRedeem(customerId: string, mobileNumber: string, redeemInfo: RedeemCreditBodyRequest): Promise<[RedeemResult, Error]> {
  try {
    const { point } = redeemInfo;
    const { point: customerPoint } = await customerRepo.findCustomerByCustomerID(customerId);

    if (customerPoint < point) {
      return [null, LError('[usecase.createRedeem]: customer points are not enough')];
    }

    let earningCredit = point;
    const creditCondition = await creditConditionRepo.findCreditConditionByPoint(point);
    if (creditCondition && creditCondition.quantity !== 0) {
      earningCredit = creditCondition.credit;
      if (creditCondition.quantity > -1) {
        await creditConditionRepo.decreaseCreditConditionQuantity(creditCondition.conditionId, 1);
      }
    }

    await customerRepo.decreasePointCustomer(mobileNumber, point);

    const newRedeem = await redeemRepo.createRedeem({
      ...redeemInfo,
      customerId,
      mobileNumber,
      point,
      credit: earningCredit,
      redeemType: RedeemTypeConstant.CREDIT,
      status: RedeemStatusConstant.REQUEST,
    });

    return [newRedeem, null];
  } catch (error) {
    throw LError('[usecase.createRedeem]: unable to create redeem', error);
  }
}

async function updateRedeem(redeemId: string, newRedeemInfo: UpdateRedeemDTO): Promise<[RedeemResult, Error]> {
  try {
    const { status } = await redeemRepo.findRedeemByRedeemID(redeemId);

    if (status === RedeemStatusConstant.SUCCESS) {
      return [null, LError('[usecase.updateRedeemStatus]: this request is already success')];
    }

    const updatedRedeem = await redeemRepo.updateRedeem(redeemId, newRedeemInfo);

    return [updatedRedeem, null];
  } catch (error) {
    throw LError('[usecase.updateRedeemStatus]: unable to update redeem status', error);
  }
}

async function updateRedeemStatus(redeemId: string, adminId: string, newStatus: RedeemStatus): Promise<[RedeemResult, Error]> {
  try {
    if (newStatus !== RedeemStatusConstant.REJECT) {
      const {
        mobileNumber, point, redeemType, status, customerId,
      } = await redeemRepo.findRedeemByRedeemID(redeemId);
      const customer = await customerRepo.findCustomerByCustomerID(customerId);

      if (!customer) {
        return [null, LError('[usecase.updateRedeemStatus]: customer is not exist')];
      }

      const { point: customerPoint, bankAccountNumber } = customer;

      if (customerPoint < point) {
        return [null, LError('[usecase.updateRedeemStatus]: customer point are not enough')];
      }

      if (status === RedeemStatusConstant.SUCCESS) {
        return [null, LError('[usecase.updateRedeemStatus]: this request is already success')];
      }

      if (newStatus === RedeemStatusConstant.SUCCESS && redeemType === RedeemTypeConstant.CREDIT) {
        const [hash] = generateHashTransaction(bankAccountNumber, mobileNumber, point);
        await queue.produceDepositJob({
          username: mobileNumber,
          amount: point,
          hash,
        });
      }
    }

    const updatedRedeem = await redeemRepo.updateRedeem(redeemId, {
      status: newStatus,
      adminId,
    });
    return [updatedRedeem, null];
  } catch (error) {
    throw LError('[usecase.updateRedeemStatus]: unable to update redeem status', error);
  }
}

export default {
  findRedeemCreditList,
  findRedeemProductList,
  createProductRedeem,
  createCreditRedeem,
  updateRedeem,
  updateRedeemStatus,
};
