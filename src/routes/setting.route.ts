import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {
  ReferralPercentageBodyRequest,
} from '../entities/dtos/setting.dtos';

import { AdminStatusConstant } from '../entities/schemas/admin.schema';
import { SystemSetting, SystemSettingTypeConstant } from '../entities/schemas/setting.schema';

import responseHandler from '../helper/response.handler';

import setting from '../usecase/setting.usecase';

class SettingRoutes {
  public prefix_route = '/system/setting';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: SystemSetting }>(
      '/',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            systemSetting: '1100',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const newSetting = request.body;

          await setting.newSettingServiceType(newSetting);

          return { acknowledge: true };
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Params: { serviceType: SystemSettingTypeConstant} }>(
      '/',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            systemSetting: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const settings = await setting.currentSetting();

          return settings;
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: { flagOTP: boolean }, Params: { serviceType: SystemSettingTypeConstant} }>(
      '/otp/:serviceType',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            systemSetting: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { flagOTP } = request.body;
          const { serviceType } = request.params;

          if (!['customer', 'admin'].includes(serviceType)) {
            return { code: 400, message: 'user type not support to set feature flag' };
          }

          await setting.settingOTP(serviceType, flagOTP);

          return { flagOTP, serviceType };
        }, reply);

        await reply;
      },
    );

    fastify.get(
      '/customer',
      async (request, reply) => {
        responseHandler(async () => {
          const settings = await setting.getSystemSettingByServiceType(SystemSettingTypeConstant.CUSTOMER);

          return settings;
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: ReferralPercentageBodyRequest, Params: { serviceType: SystemSettingTypeConstant} }>(
      '/referral/:serviceType',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            systemSetting: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          // (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { serviceType } = request.params;
          const referral = request.body;
          if (!['customer'].includes(serviceType)) {
            return { code: 400, message: 'user type not support to set feature flag' };
          }

          await setting.referralPercentageSetting(serviceType, referral);

          return { referral, serviceType };
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Params: { serviceType: SystemSettingTypeConstant} }>(
      '/:serviceType',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            systemSetting: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          // (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { serviceType } = request.params;
          if (!['customer', 'admin'].includes(serviceType)) {
            return { code: 400, message: 'user type not support to set feature flag' };
          }

          const result = await setting.getSystemSettingByServiceType(serviceType);

          return result;
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default SettingRoutes;
