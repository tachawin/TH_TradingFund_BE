import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {
  CreditConditionBodyRequest,
  ListCreditConditionQueries,
  UpdateCreditConditionParams,
  DeleteCreditConditionBodyRequest,
} from '../entities/dtos/credit_condition.dtos';
import { AdminAccessTokenPayload } from '../entities/interfaces/data/token.interface';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';

import responseHandler from '../helper/response.handler';

import creditCondition from '../usecase/credit_condition.usecase';

class CreditConditionRoutes {
  public prefix_route = '/credit_condition';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: CreditConditionBodyRequest }>(
      '/create',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            creditCondition: '1100',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { body: creditConditionInfo } = request;
          const { adminId } = request.user as AdminAccessTokenPayload;

          const data = await creditCondition.createCreditCondition({
            ...creditConditionInfo,
            adminId,
          });

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListCreditConditionQueries }>(
      '/list',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            creditCondition: '1000',
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

          const data = await creditCondition.findCreditConditionList(filters);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.delete<{ Body: DeleteCreditConditionBodyRequest }>(
      '/delete',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            creditCondition: '1011',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { conditionId } = request.body;

          const deleted = await creditCondition.deleteCreditCondition(conditionId);
          if (!deleted) {
            return { code: 204, message: 'credit_condition not exist, please contact super credit_condition' };
          }

          return { code: 202, message: 'deleted credit_condition successfully' };
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: CreditConditionBodyRequest, Params: UpdateCreditConditionParams }>(
      '/update/:conditionId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            creditCondition: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { conditionId } = request.params as UpdateCreditConditionParams;
          const infoChange = request.body;

          const newCreditCondition = await creditCondition.updateCreditCondition(conditionId, infoChange);

          return newCreditCondition;
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default CreditConditionRoutes;
