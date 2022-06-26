/* eslint-disable consistent-return */
import {
  FastifyInstance, FastifyPluginOptions,
} from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifyPlugin from 'fastify-plugin';

import config from '../config/config';
import { cookieOptionsAdminRefreshToken } from '../helper/cookie.handler';

const cookiesPlugin = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: any) => {
  fastify.register(fastifyCookie, {
    secret: config.cookie.admin.refresh_token.secret,
    parseOptions: {
      ...cookieOptionsAdminRefreshToken,
    },
  });

  done();
};

export default fastifyPlugin(cookiesPlugin);
