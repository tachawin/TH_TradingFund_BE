import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import config from '../config/config';

import {
  CustomerLoginRequest,
  AdminUserFormatRequest,
} from '../entities/dtos/auth.dtos';
import { UpdateCustomerPasswordBodyRequest } from '../entities/dtos/customer.dtos';
import { CustomerAccessTokenPayload } from '../entities/interfaces/data/token.interface';

import { cookieOptionsCustomerRefreshToken } from '../helper/cookie.handler';
import { newPasswordValidate } from '../helper/customer.validator';
import { hashing } from '../helper/hash.handler';
import responseHandler from '../helper/response.handler';

import customerAuth from '../usecase/customer.auth.usecase';

class CustomerAuthRoutes {
  public prefix_route = '/auth/customer';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: CustomerLoginRequest }>('/login', async (request, reply) => {
      responseHandler(async () => {
        const { body: { mobileNumber, password } } = request;

        const result = await customerAuth.customerLogin(mobileNumber, password);

        if (result.length === 0) {
          return { code: '403', message: 'unable to login' };
        }

        const [refreshToken, accessToken, customerInfo] = result;

        const cookieRefreshTokenName = config.cookie.customer.refresh_token.cookie_name;
        reply.setCookie(cookieRefreshTokenName, refreshToken, cookieOptionsCustomerRefreshToken);

        return {
          refreshToken,
          accessToken,
          ...customerInfo,
        };
      }, reply);

      await reply;
    });

    fastify.post('/2fa/token/refresh', { preValidation: [(fastify as any).auth_customer_refresh_token] }, async (request, reply) => {
      responseHandler(async () => {
        const { refreshToken } = request.user as AdminUserFormatRequest;

        const accessToken = await customerAuth.customerRenewAccessTokenFromRefreshToken(refreshToken);

        return { accessToken };
      }, reply);

      await reply;
    });

    fastify.put<{ Body: UpdateCustomerPasswordBodyRequest }>(
      '/password',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        // eslint-disable-next-line consistent-return
        responseHandler(async () => {
          const { oldPassword, newPassword } = request.body;
          const { customerId } = request.user as CustomerAccessTokenPayload;

          newPasswordValidate(newPassword);

          const newPasswordHashed = hashing(newPassword);

          const updated = await customerAuth.customerResetPassword(customerId, oldPassword, newPasswordHashed);
          if (!updated) {
            reply.send({ code: 204, status: 'failed', message: 'updated customer password failed' });
          }

          reply.send({ code: 202, status: 'success', message: 'updated customer password successfully' });
        }, reply);
        await reply;
      },
    );

    done();
  }
}

export default CustomerAuthRoutes;
