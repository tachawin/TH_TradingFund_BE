import fastifyMultiPartPlugin from '@fastify/multipart';
import {
  FastifyInstance, FastifyPluginOptions,
} from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import config from '../config/config';

const multipartPlugin = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: any) => {
  fastify.register(fastifyMultiPartPlugin, {
    ...config.multipart.options,
  });

  done();
};

export default fastifyPlugin(multipartPlugin);
