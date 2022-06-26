import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { RedeemStatusParams } from '../entities/dtos/redeem.dtos';
import {
  ListRedeemProductQueries, RedeemProductBodyRequest, UpdateRedeemProductBody, UpdateRedeemProductParams,
} from '../entities/dtos/redeem_product.dtos';
import { AdminAccessTokenPayload, CustomerAccessTokenPayload } from '../entities/interfaces/data/token.interface';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';
import { RedeemStatusConstant } from '../entities/schemas/redeem.schema';

import responseHandler from '../helper/response.handler';

import redeem from '../usecase/redeem.usecase';

class RedeemProductRoutes {
  public prefix_route = '/redeem_product';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: RedeemProductBodyRequest }>(
      '/create',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { body: productRequest } = request;
          const { customerId, mobileNumber } = request.user as CustomerAccessTokenPayload;

          const [data, err] = await redeem.createProductRedeem(customerId, mobileNumber, productRequest);
          if (err) {
            reply.send({ code: 204, err: err.message });
          }

          reply.send({ code: 201, data });
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListRedeemProductQueries, Params: RedeemStatusParams }>(
      '/list/:redeemStatus',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            reward: '1000',
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
          let parsedFilter: ListRedeemProductQueries = { ...filters };

          if (redeemStatus === 'history') {
            parsedFilter = { ...filters, status: [RedeemStatusConstant.SUCCESS, RedeemStatusConstant.REJECT] };
          } else if (redeemStatus) {
            parsedFilter = { ...filters, status: [redeemStatus] };
          }

          const data = await redeem.findRedeemProductList(parsedFilter);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Params: UpdateRedeemProductParams }>(
      '/accept/:redeemId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            reward: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { redeemId } = request.params as UpdateRedeemProductParams;
          const { adminId } = request.user as AdminAccessTokenPayload;

          const [data, err] = await redeem.updateRedeemStatus(redeemId, adminId, RedeemStatusConstant.SENDING);
          if (err) {
            reply.send({ code: 204, err: err.message });
          }

          reply.send({ code: 201, data });
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Params: UpdateRedeemProductParams, Body: UpdateRedeemProductBody }>(
      '/sending/:redeemId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            reward: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { redeemId } = request.params as UpdateRedeemProductParams;
          const { notes } = request.body;

          const [data, err] = await redeem.updateRedeem(redeemId, {
            notes,
            status: RedeemStatusConstant.SUCCESS,
          });
          if (err) {
            reply.send({ code: 204, err: err.message });
          }

          reply.send({ code: 201, data });
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Params: UpdateRedeemProductParams }>(
      '/reject/:redeemId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            reward: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { redeemId } = request.params as UpdateRedeemProductParams;
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

export default RedeemProductRoutes;
