import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {
  CustomerLevelBodyRequest,
  DeleteCustomerLevelBodyRequest,
  ListCustomerLevelQueries,
  UpdateCustomerLevelParams,
  UpdateInformationLevelBodyRequest,
} from '../entities/dtos/customer_level.dtos';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';

import { customerLevelInformationUpdateValidate } from '../helper/customer_level.validator';
import responseHandler from '../helper/response.handler';

import customerLevel from '../usecase/level.customer.usecase';

class LevelRoutes {
  public prefix_route = '/level';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: CustomerLevelBodyRequest }>(
      '/create',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            level: '1100',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { body: levelInfo } = request;

          const data = await customerLevel.createLevel(levelInfo);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListCustomerLevelQueries }>(
      '/list',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            level: '1000',
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

          const data = await customerLevel.findLevelList(filters);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListCustomerLevelQueries }>(
      '/condition_list',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const filters = request.query;

          const data = await customerLevel.findLevelListForCustomer(filters);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: UpdateInformationLevelBodyRequest, Params: UpdateCustomerLevelParams }>(
      '/update/:levelId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            level: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { levelId } = request.params as UpdateCustomerLevelParams;
          const infoChange = request.body;

          customerLevelInformationUpdateValidate(infoChange);

          const newLevel = await customerLevel.updateLevel(levelId, infoChange);

          return newLevel;
        }, reply);

        await reply;
      },
    );

    fastify.delete<{ Body: DeleteCustomerLevelBodyRequest }>(
      '/delete',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            level: '1011',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { levelId } = request.body;

          const deleted = await customerLevel.deleteLevel(levelId);
          if (!deleted) {
            return { code: 204, message: 'level not exist, please contact super admin' };
          }
          return { code: 202, message: 'delete level successfully' };
        }, reply);

        await reply;
      },
    );

    fastify.post<{ Body: { productId: string, file: any} }>(
      '/upload/image',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            product: '1110',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          if (!request.isMultipart()) {
            return { code: 400, message: 'unable to upload the image, request is not multipart' };
          }

          const { file } = await request.file();

          const objectURL = await customerLevel.uploadLevelImage(file);

          return { imageURL: objectURL };
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default LevelRoutes;
