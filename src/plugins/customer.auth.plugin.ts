/* eslint-disable consistent-return */
import {
  FastifyInstance, FastifyPluginOptions, FastifyReply,
} from 'fastify';
import fastifyJWT from 'fastify-jwt';
import fastifyPlugin from 'fastify-plugin';
import jwt from 'jsonwebtoken';

import config from '../config/config';

import { CustomerAccessTokenPayload } from '../entities/interfaces/data/token.interface';

import { LError, SError } from '../helper/errors.handler';
import { responseSender } from '../helper/response.handler';
import parseResponse from '../helper/response.parser';

const accessTokenCustomerAuthPlugin = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) => {
  fastify.register(fastifyJWT, {
    secret: config.jwt.customer.access_token.secret.jwt_secret,
    namespace: config.jwt.customer.access_token.namespace,
    jwtVerify: 'jwtVerifyAccessTokenCustomer',
  });

  fastify.decorate('auth_customer_access_token', async (request: any, reply: FastifyReply) => {
    try {
      const payload: CustomerAccessTokenPayload = await request.jwtVerifyAccessTokenCustomer();

      request.user = {
        ...payload,
      };
    } catch (error) {
      LError('[CustomerAuthPlugin.auth_customer_access_token]: unauthorize', error);

      if (error.message === 'Authorization token expired') {
        responseSender(parseResponse(SError('ERR.CUSTOMER.AUTH.ACCESS_TOKEN.1')), reply);

        return;
      }

      responseSender(parseResponse({
        code: 401,
        message: `unauthorize, ${error.message}`,
      }), reply);
    }
  });

  done();
};

const refreshTokenCustomerAuthPlugin = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) => {
  fastify.register(fastifyJWT, {
    secret: config.jwt.customer.refresh_token.secret.jwt_secret,
    namespace: config.jwt.customer.refresh_token.namespace,
    jwtVerify: 'jwtVerifyRefreshTokenCustomer',
    cookie: {
      cookieName: config.cookie.customer.refresh_token.cookie_name,
      signed: config.cookie.customer.refresh_token.options.signed,
    },
  });

  fastify.decorate('auth_customer_refresh_token', async (request: any, reply: FastifyReply) => {
    try {
      // TODO: remove these line, workaround for development with dev/prod in same service
      // and remove jsonwebtoken pkg
      const { body } = request;
      if (body?.refreshToken) {
        const decoded = jwt.verify(body.refreshToken, config.jwt.customer.refresh_token.secret.jwt_secret) as object;

        request.user = {
          ...decoded,
          refreshToken: body.refreshToken,
        };

        return;
      }

      const payload = await request.jwtVerifyRefreshTokenCustomer();

      const refreshTokenCookieName = config.cookie.customer.refresh_token.cookie_name;
      const cookieUnsigned = request.unsignCookie(request.cookies[refreshTokenCookieName]);

      request.user = {
        ...payload,
        refreshToken: cookieUnsigned.value,
      };
    } catch (error) {
      LError('[CustomerAuthPlugin.auth_customer_refresh_token]: unauthorize', error);

      responseSender(parseResponse({
        code: 401,
        message: `unauthorize, ${error.message}`,
      }), reply);
    }
  });

  done();
};

export default {
  AccessTokenCustomerAuthPlugin: fastifyPlugin(accessTokenCustomerAuthPlugin),
  RefreshTokenCustomerAuthPlugin: fastifyPlugin(refreshTokenCustomerAuthPlugin),
};
