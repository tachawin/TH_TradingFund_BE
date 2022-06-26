import AWSAdapter from '../adapters/aws.adapter';
import RedisAdapter from '../adapters/redis.adapter';

import config from '../config/config';

import { CustomerLoginResponse } from '../entities/schemas/customer.schema';

import { LError } from '../helper/errors.handler';
import { compareHashed } from '../helper/hash.handler';
import {
  generateAccessTokenCustomer,
  generateRefreshTokenCustomer,
  verifyAndDecodeCustomerRefreshToken,
} from '../helper/token.helper';

import CustomerRepository from '../repositories/customer.repository';

const awsAdapter = AWSAdapter.getInstance();
const redisClient = RedisAdapter.getInstance();

const customerRepo = CustomerRepository.getInstance();

async function customerLogin(mobileNumber: string, password: string): Promise<[ string, string, CustomerLoginResponse] | []> {
  try {
    const existCustomer = await customerRepo.findCustomerByMobileNumber(mobileNumber);
    if (!existCustomer) {
      return [];
    }
    const {
      customerId,
      password: passwordHashed,
      name,
      // levelId,
      bankAccountName,
      bankAccountNumber,
      bankName,
    } = existCustomer;

    const matched = compareHashed(password, passwordHashed);
    if (!matched) {
      return [];
    }

    customerRepo.updateCustomer(customerId, { lastLoginAt: new Date() });

    const refreshToken = generateRefreshTokenCustomer({
      customerId,
      // levelId,
    });

    const accessToken = generateAccessTokenCustomer({
      customerId,
      name,
      mobileNumber,
      // levelId,
    });

    const keyVerifyRefreshToken = redisClient.getKeyCustomerRefreshToken(refreshToken);
    const expiresInRefreshToken = config.db.redis.keys.customer.verify_refresh_token.expires_in;
    await redisClient.setex(keyVerifyRefreshToken, customerId, expiresInRefreshToken);

    const customerInfo = {
      name, mobileNumber, bankAccountName, bankAccountNumber, bankName,
    };

    return [refreshToken, accessToken, customerInfo];
  } catch (error) {
    throw LError('[CustomerAuthUsecase.customerLogin]: unable to login', error);
  }
}

async function customerSendOneTimePassword(mobileNumber: string): Promise<string> {
  try {
    const existCustomer = await customerRepo.findCustomerByMobileNumber(mobileNumber);
    if (existCustomer) {
      throw LError('[CustomerAuthUsecase.customerSendOneTimePassword]: there is existing customer with this mobile number');
    }

    const refCode = await awsAdapter.sns().sendOneTimePassword(mobileNumber, async (otp: string, refCodeOnSMS: string) => {
      const key = redisClient.getKeyCustomerVerifyOTP(mobileNumber, refCodeOnSMS);
      const expiresIn = config.db.redis.keys.customer.verify_otp.expires_in;

      await redisClient.setex(key, otp, expiresIn);
    });

    return refCode;
  } catch (error) {
    throw LError('[CustomerAuthUsecase.customerSendOneTimePassword]: unable to publish otp to the mobile number');
  }
}

async function customerVerifyWithOTP(mobileNumber: string, refCode: string, otpConfirm: string): Promise<string> {
  try {
    const existCustomer = await customerRepo.findCustomerByMobileNumber(mobileNumber);
    if (existCustomer) {
      throw LError('[CustomerAuthUsecase.customerVerifyWithOTP]: there is existing customer with this mobile number');
    }

    const keyVerifyOTP = redisClient.getKeyCustomerVerifyOTP(mobileNumber, refCode);
    const otpCached = await redisClient.get(keyVerifyOTP);
    if (otpCached !== otpConfirm) {
      return 'failed';
    }
    return 'success';
  } catch (error) {
    throw LError('[CustomerAuthUsecase.customerVerifyWithOTP]: unable to verify the otp', error);
  }
}

async function customerRenewAccessTokenFromRefreshToken(refreshToken: string): Promise<string> {
  try {
    const key = redisClient.getKeyCustomerRefreshToken(refreshToken);

    const exists = await redisClient.exists(key);
    if (exists === 0) {
      throw LError('[CustomerAuthUsecase.renewAccessTokenFromRefreshToken]: unable to get the refresh token on cache');
    }

    const customerId = await redisClient.get(key);

    const decoded = verifyAndDecodeCustomerRefreshToken(refreshToken);
    if (!('customerId' in decoded)) {
      throw LError('[CustomerAuthUsecase.renewAccessTokenFromRefreshToken]: unable to verify/decode the token');
    }

    const { customerId: customerIdInToken } = decoded;
    if (customerIdInToken !== customerId) {
      throw LError('[CustomerAuthUsecase.renewAccessTokenFromRefreshToken]: unable to use refresh token the state of token is invalid');
    }

    const existCustomer = await customerRepo.findCustomerByCustomerID(customerId);
    if (!existCustomer) {
      throw LError('[CustomerAuthUsecase.customerLoginVerifyWithOTP]: unable to find existing customer');
    }

    const {
      name, mobileNumber, /* levelId, */
    } = existCustomer;

    const accessToken = generateAccessTokenCustomer({
      customerId,
      name,
      mobileNumber,
      // levelId,
    });

    return accessToken;
  } catch (error) {
    throw LError('[CustomerAuthUsecase.renewAccessTokenFromRefreshToken]: unable to renew access_token with refresh_token', error);
  }
}

async function customerResetPassword(
  customerId: string,
  oldPassword: string,
  newPassword: string,
): Promise<boolean> {
  try {
    const existCustomer = await customerRepo.findCustomerByCustomerID(customerId);
    if (!existCustomer) {
      throw LError('[CustomerAuthUsecase.customerResetPassword]: unable to find existing customer');
    }
    const { password: passwordHashed } = existCustomer;

    const matched = compareHashed(oldPassword, passwordHashed);
    if (!matched) {
      return false;
    }

    const updatedCount = await customerRepo.updateCustomerPassword(customerId, newPassword);
    if (updatedCount === 0) {
      return false;
    }

    return true;
  } catch (error) {
    throw LError('[CustomerAuthUsecase.customerResetPassword]: unable to change password', error);
  }
}

export default {
  customerLogin,
  customerSendOneTimePassword,
  customerVerifyWithOTP,
  customerRenewAccessTokenFromRefreshToken,
  customerResetPassword,
};
