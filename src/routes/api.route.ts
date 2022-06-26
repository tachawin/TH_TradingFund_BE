import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { APITokenPayload } from '../entities/interfaces/data/token.interface';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';

import responseHandler from '../helper/response.handler';

import api from '../usecase/api.usecase';

class APIExternalServiceRoutes {
  public prefix_route = '/external/service';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: APITokenPayload }>(
      '/register',
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
          const info = request.body;

          const apiKey = await api.registerExternalService(info);

          return { apiKey };
        }, reply);

        await reply;
      },
    );

    fastify.get(
      '/healthcheck',
      {
        preValidation: [
          (fastify as any).webhook_transaction_auth,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => ({ acknowledge: true }), reply);

        await reply;
      },
    );

    done();
  }
}

export default APIExternalServiceRoutes;
