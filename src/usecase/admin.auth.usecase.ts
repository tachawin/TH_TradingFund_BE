import AWSAdapter from '../adapters/aws.adapter';
import RedisAdapter from '../adapters/redis.adapter';

import config from '../config/config';

import { AdminLoginCredentialDTO } from '../entities/dtos/admin.dtos';
import { SystemSettingTypeConstant } from '../entities/schemas/setting.schema';

import { LError } from '../helper/errors.handler';
import { compareHashed } from '../helper/hash.handler';
import {
  generateAccessTokenAdmin,
  generateRefreshTokenAdmin,
  verifyAndDecodeAdminRefreshToken,
} from '../helper/token.helper';

import AdminRepository from '../repositories/admin.repository';
import SystemSettingRepository from '../repositories/setting.repository';

const developmentMode = config.app.kind === 'development';

const redisClient = RedisAdapter.getInstance();
const awsAdapter = AWSAdapter.getInstance();

const adminRepo = AdminRepository.getInstance();
const systemSettingRepo = SystemSettingRepository.getInstance();

async function adminLogin(username: string, password: string): Promise<AdminLoginCredentialDTO> {
  try {
    const existAdmin = await adminRepo.findAdminByUsername(username);
    if (!existAdmin) {
      throw LError('[AuthUsecase.adminLogin]: unable to find existing admin');
    }
    const {
      role,
      status,
      name,
      mobileNumber,
      features,
      adminId,
      password: passwordHashed,
    } = existAdmin;

    const matched = compareHashed(password, passwordHashed);
    if (!matched) {
      throw LError('[AuthUsecase.adminLogin]: unable to login, invalid password');
    }

    const { flagOTP: useOTP } = await systemSettingRepo.findSystemSettingByServiceType(SystemSettingTypeConstant.ADMIN);

    if (!useOTP) {
      const refreshToken = generateRefreshTokenAdmin({
        adminId,
        role,
        status,
      });

      const accessToken = generateAccessTokenAdmin({
        adminId,
        username,
        role,
        status,
        name,
        mobileNumber,
        features,
      });

      const keyVerifyRefreshToken = redisClient.getKeyAdminRefreshToken(refreshToken);
      const expiresInRefreshToken = config.db.redis.keys.admin.verify_refresh_token.expires_in;
      await redisClient.setex(keyVerifyRefreshToken, adminId, expiresInRefreshToken);

      const keyVerifyAdminPermission = redisClient.getKeyVerifyAdminPermission(adminId);
      await redisClient.setJSON(keyVerifyAdminPermission, '.', { status, role, features });

      return {
        useOTP,
        adminId,
        accessToken,
        refreshToken,
      };
    }

    const refCode = await awsAdapter.sns().sendOneTimePassword(mobileNumber, async (otp: string, refCodeOnSMS: string) => {
      const key = redisClient.getKeyAdminVerifyOTP(adminId, refCodeOnSMS);
      const expiresIn = config.db.redis.keys.admin.verify_otp.expires_in;

      await redisClient.setex(key, otp, expiresIn);
    });

    return {
      useOTP,
      adminId,
      refCode,
    };
  } catch (error) {
    throw LError('[AuthUsecase.adminLogin]: unable to publish otp to the mobile number', error);
  }
}

async function adminResendOneTimePassword(adminId: string, refCode: string): Promise<string> {
  try {
    const existAdmin = await adminRepo.findAdminByAdminID(adminId);
    if (!existAdmin) {
      throw LError('[AuthUsecase.resendOneTimePassword]: unable to find existing admin');
    }

    const keyVerifyOTP = redisClient.getKeyAdminVerifyOTP(adminId, refCode);
    const count = await redisClient.exists(keyVerifyOTP);
    if (count === 0) {
      throw LError('[AuthUsecase.resendOneTimePassword]: unable to find existing one time password waiting confirm in the cached');
    }

    const { mobileNumber } = existAdmin;
    const newRefCode = await awsAdapter.sns().sendOneTimePassword(mobileNumber, async (otp: string, refCodeOnSMS: string) => {
      const key = redisClient.getKeyAdminVerifyOTP(adminId, refCodeOnSMS);
      const expiresIn = config.db.redis.keys.admin.verify_otp.expires_in;

      await redisClient.setex(key, otp, expiresIn);
    });

    return newRefCode;
  } catch (error) {
    throw LError('[AuthUsecase.resendOneTimePassword]: unable to publish otp to the mobile number');
  }
}

async function adminLoginVerifyWithOTP(adminId: string, refCode: string, otpConfirm: string): Promise<[string, string]> {
  try {
    const existAdmin = await adminRepo.findAdminByAdminID(adminId);
    if (!existAdmin) {
      throw LError('[AuthUsecase.adminLoginVerifyWithOTP]: unable to find existing admin');
    }

    const keyVerifyOTP = redisClient.getKeyAdminVerifyOTP(adminId, refCode);
    const otpCached = await redisClient.get(keyVerifyOTP);

    if (!developmentMode && otpCached !== otpConfirm) {
      throw LError(`[AuthUsecase.adminLoginVerifyWithOTP]: unable to verify otp, otp not match:adminId:${adminId}:refCode:${refCode}`);
    }

    const {
      username, role, status, name, mobileNumber, features,
    } = existAdmin;

    const refreshToken = generateRefreshTokenAdmin({
      adminId,
      role,
      status,
    });

    const accessToken = generateAccessTokenAdmin({
      adminId,
      username,
      role,
      status,
      name,
      mobileNumber,
      features,
    });

    const keyVerifyRefreshToken = redisClient.getKeyAdminRefreshToken(refreshToken);
    const expiresInRefreshToken = config.db.redis.keys.admin.verify_refresh_token.expires_in;
    await redisClient.setex(keyVerifyRefreshToken, adminId, expiresInRefreshToken);

    const keyVerifyAdminPermission = redisClient.getKeyVerifyAdminPermission(adminId);
    await redisClient.setJSON(keyVerifyAdminPermission, '.', { status, role, features });

    return [refreshToken, accessToken];
  } catch (error) {
    throw LError('[AuthUsecase.adminLoginVerifyWithOTP]: unable to verify the otp', error);
  }
}

async function adminRenewAccessTokenFromRefreshToken(refreshToken: string): Promise<string> {
  try {
    const key = redisClient.getKeyAdminRefreshToken(refreshToken);
    const exists = await redisClient.exists(key);
    if (exists === 0) {
      return '';
    }

    const adminId = await redisClient.get(key);

    const decoded = verifyAndDecodeAdminRefreshToken(refreshToken);
    if (!('adminId' in decoded)) {
      throw LError('[AutUsecase.renewAccessTokenFromRefreshToken]: unable to verify/decode the token');
    }

    const { adminId: adminIdInToken } = decoded;
    if (adminIdInToken !== adminId) {
      throw LError('[AutUsecase.renewAccessTokenFromRefreshToken]: unable to use refresh token the state of token is invalid');
    }

    const existAdmin = await adminRepo.findAdminByAdminID(adminId);
    if (!existAdmin) {
      throw LError('[AuthUsecase.adminLoginVerifyWithOTP]: unable to find existing admin');
    }

    const {
      username, role, status, name, mobileNumber, features,
    } = existAdmin;

    const accessToken = generateAccessTokenAdmin({
      adminId,
      username,
      role,
      status,
      name,
      mobileNumber,
      features,
    });

    return accessToken;
  } catch (error) {
    throw LError('[AutUsecase.renewAccessTokenFromRefreshToken]: unable to renew access_token with refresh_token', error);
  }
}

async function adminLogout(adminId: string, refreshToken: string): Promise<void> {
  const keyVerifyAdminPermission = redisClient.getKeyVerifyAdminPermission(adminId);
  await redisClient.del(keyVerifyAdminPermission);

  const key = redisClient.getKeyAdminRefreshToken(refreshToken);
  await redisClient.del(key);
}

export default {
  adminLogin,
  adminLogout,
  adminResendOneTimePassword,
  adminLoginVerifyWithOTP,
  adminRenewAccessTokenFromRefreshToken,
};
