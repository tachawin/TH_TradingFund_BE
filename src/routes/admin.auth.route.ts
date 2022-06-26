import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import config from '../config/config';

import {
  AdminLoginRequest,
  AdminResendOTPRequest,
  AdminVerifyAdminWithOTPRequest,
  AdminUserFormatRequest,
} from '../entities/dtos/auth.dtos';

import { cookieOptionsAdminRefreshToken } from '../helper/cookie.handler';
import responseHandler from '../helper/response.handler';

import auth from '../usecase/admin.auth.usecase';

class AuthRoutes {
  public prefix_route = '/auth/admin';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: AdminLoginRequest }>('/login', async (request, reply) => {
      responseHandler(async () => {
        const { body: { username, password } } = request;

        const credential = await auth.adminLogin(username, password);

        const { refreshToken, useOTP } = credential;
        if (!useOTP) {
          const cookieRefreshTokenName = config.cookie.admin.refresh_token.cookie_name;
          reply.setCookie(cookieRefreshTokenName, refreshToken, cookieOptionsAdminRefreshToken);
        }

        return credential;
      }, reply);

      await reply;
    });

    fastify.post<{ Body: AdminResendOTPRequest }>('/2fa/resend/otp', async (request, reply) => {
      responseHandler(async () => {
        const { body: { adminId, refCode } } = request;

        const newRefCode = await auth.adminResendOneTimePassword(adminId, refCode);

        return { adminId, refCode: newRefCode };
      }, reply);

      await reply;
    });

    fastify.post<{ Body: AdminVerifyAdminWithOTPRequest }>('/2fa/verify/otp', async (request, reply) => {
      responseHandler(async () => {
        const { body: { adminId, refCode, otpConfirm } } = request;

        const [refreshToken, accessToken] = await auth.adminLoginVerifyWithOTP(adminId, refCode, otpConfirm);

        const cookieRefreshTokenName = config.cookie.admin.refresh_token.cookie_name;
        reply.setCookie(cookieRefreshTokenName, refreshToken, cookieOptionsAdminRefreshToken);

        return { refreshToken, accessToken };
      }, reply);

      await reply;
    });

    fastify.post('/2fa/token/refresh', { preValidation: [(fastify as any).auth_admin_refresh_token] }, async (request, reply) => {
      responseHandler(async () => {
        const { refreshToken } = request.user as AdminUserFormatRequest;

        const accessToken = await auth.adminRenewAccessTokenFromRefreshToken(refreshToken);

        return { accessToken };
      }, reply);

      await reply;
    });

    fastify.post('/logout', { preValidation: [(fastify as any).auth_admin_refresh_token] }, async (request, reply) => {
      responseHandler(async () => {
        const { refreshToken, adminId } = request.user as AdminUserFormatRequest;

        const cookieRefreshTokenName = config.cookie.admin.refresh_token.cookie_name;
        const cookieRefreshTokenOptions = config.cookie.admin.refresh_token.options;

        await auth.adminLogout(adminId, refreshToken);

        reply.setCookie(cookieRefreshTokenName, refreshToken, {
          ...cookieRefreshTokenOptions,
          expires: 0,
        });

        return 'logout successfully';
      }, reply);

      await reply;
    });

    done();
  }
}

export default AuthRoutes;
