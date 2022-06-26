/* eslint-disable consistent-return */

import {
  FastifyInstance, FastifyPluginOptions, FastifyReply,
} from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import config from '../config/config';

import { decryptWebhookTransaction } from '../helper/crypto.handler';

import { LError } from '../helper/errors.handler';
import { responseSender } from '../helper/response.handler';
import parseResponse from '../helper/response.parser';

const webhookTransactionAuthPlugin = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) => {
  fastify.decorate('webhook_transaction_auth', async (request: any, reply: FastifyReply) => {
    try {
      const key: string = request.headers[config.encrypt.webhook_transaction.extractor.header] as string;
      const domain = decryptWebhookTransaction(key);

      request.user = { domain };
    } catch (error) {
      LError('[AuthPlugin.webhook_transaction_auth]: unauthorize', error);

      responseSender(parseResponse({
        code: 401,
        message: `unauthorize, ${error.message}`,
      }), reply);
    }
  });

  done();
};

export default fastifyPlugin(webhookTransactionAuthPlugin);
