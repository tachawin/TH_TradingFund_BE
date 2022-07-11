import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { RedeemStatusParams } from '../entities/dtos/redeem.dtos';
import { ListRedeemCreditQueries, RedeemCreditBodyRequest, UpdateRedeemCreditParams } from '../entities/dtos/redeem_credit.dtos';
import { AdminAccessTokenPayload, CustomerAccessTokenPayload } from '../entities/interfaces/data/token.interface';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';
import { RedeemStatusConstant } from '../entities/schemas/redeem.schema';

import responseHandler from '../helper/response.handler';

import redeem from '../usecase/redeem.usecase';

class RedeemCreditRoutes {
  public prefix_route = '/redeem_credit';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: RedeemCreditBodyRequest }>(
      '/create',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { body: creditRequest } = request;
          const { customerId, mobileNumber } = request.user as CustomerAccessTokenPayload;

          const [data, err] = await redeem.createCreditRedeem(customerId, mobileNumber, creditRequest);
          if (err) {
            reply.send({ code: 204, err: err.message });
          }

          reply.send({ code: 201, data });
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListRedeemCreditQueries, Params: RedeemStatusParams }>(
      '/list/:redeemStatus',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            credit: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const filters = request.query;
          const { redeemStatus } = request.params;
          let parsedFilter: ListRedeemCreditQueries = { ...filters };

          if (redeemStatus === 'history') {
            parsedFilter = { ...filters, status: [RedeemStatusConstant.SUCCESS, RedeemStatusConstant.REJECT] };
          } else if (redeemStatus) {
            parsedFilter = { ...filters, status: [redeemStatus] };
          }

          const { status } = filters;
          if (status && typeof status === 'string') {
            parsedFilter = { ...parsedFilter, status: status.split(',') };
          }

          const data = await redeem.findRedeemCreditList(parsedFilter);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Params: UpdateRedeemCreditParams }>(
      '/accept/:redeemId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            credit: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { redeemId } = request.params;
          const { adminId } = request.user as AdminAccessTokenPayload;

          const [data, err] = await redeem.updateRedeemStatus(redeemId, adminId, RedeemStatusConstant.SUCCESS);
          if (err) {
            reply.send({ code: 204, err: err.message });
          }

          reply.send({ code: 201, data });
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Params: UpdateRedeemCreditParams }>(
      '/reject/:redeemId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            credit: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { redeemId } = request.params as UpdateRedeemCreditParams;
          const { adminId } = request.user as AdminAccessTokenPayload;

          const [data, err] = await redeem.updateRedeemStatus(redeemId, adminId, RedeemStatusConstant.REJECT);
          if (err) {
            reply.send({ code: 204, err: err.message });
          }

          reply.send({ code: 201, data });
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default RedeemCreditRoutes;
