import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { CustomerUserFormatRequest } from '../entities/dtos/auth.dtos';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';

import responseHandler from '../helper/response.handler';

import cashback from '../usecase/cashback.usecase';

class CashbackRoutes {
  public prefix_route = '/cashback';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.get(
      '/customer/current',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { mobileNumber } = request.user as CustomerUserFormatRequest;

          const currentCashback = await cashback.currentCashback(mobileNumber);

          return { amount: currentCashback };
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Params: { mobileNumber: string } }>(
      '/customer/:mobileNumber/current',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            cashback: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { mobileNumber } = request.params;

          const currentCashback = await cashback.currentCashback(mobileNumber);

          return { amount: currentCashback };
        }, reply);

        await reply;
      },
    );

    fastify.get(
      '/customer/history',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { mobileNumber } = request.user as CustomerUserFormatRequest;

          const currentCashback = await cashback.cashbackHistory(mobileNumber);

          return currentCashback;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Params: { mobileNumber: string } }>(
      '/customer/:mobileNumber/history',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            cashback: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { mobileNumber } = request.params;

          const currentCashback = await cashback.cashbackHistory(mobileNumber);

          return currentCashback;
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default CashbackRoutes;
