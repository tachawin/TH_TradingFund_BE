import {
  FastifyInstance, FastifyPluginOptions,
} from 'fastify';
import fastifyCORS from 'fastify-cors';
import fastifyPlugin from 'fastify-plugin';

import config from '../config/config';

const corsPlugin = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: any) => {
  fastify.register(fastifyCORS, {
    // origin: '*',
    ...config.cors.options,
    origin: ['http://luckynobug.com', /\.luckynobug\.com$/, /\.ngrok\.io$/, 'http://localhost:3000', 'http://localhost:8000'], // YAML escape regex syntax
  });

  done();
};

export default fastifyPlugin(corsPlugin);
