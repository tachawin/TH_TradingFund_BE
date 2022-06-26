/* eslint-disable consistent-return */

import {
  FastifyInstance, FastifyPluginOptions, FastifyReply,
} from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { AdminAccessTokenPayload, CustomerAccessTokenPayload } from '../entities/interfaces/data/token.interface';

import { LError } from '../helper/errors.handler';
import { responseSender } from '../helper/response.handler';
import parseResponse from '../helper/response.parser';

const accessTokenCommonAuthPlugin = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) => {
  fastify.decorate('auth_common_access_token', async (request: any, reply: FastifyReply) => {
    try {
      const adminTokenPayload: AdminAccessTokenPayload = await request.jwtVerifyAccessTokenAdmin();
      request.user = { ...adminTokenPayload };
    } catch (error) {
      try {
        const customerTokenPayload: CustomerAccessTokenPayload = await request.jwtVerifyAccessTokenCustomer();
        request.user = { ...customerTokenPayload };
      } catch (error) {
        LError('[CommonAuthPlugin.auth_common_access_token]: unauthorize', error);

        responseSender(parseResponse({
          code: 401,
          message: `unauthorize, ${error.message}`,
        }), reply);
      }
    }
  });

  done();
};

export default {
  AccessTokenCommonAuthPlugin: fastifyPlugin(accessTokenCommonAuthPlugin),
};
