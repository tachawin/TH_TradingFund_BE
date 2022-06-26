import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {
  TransactionWebhookEvent,
} from '../entities/dtos/transaction.dtos';

import responseHandler from '../helper/response.handler';

import webhookTransaction from '../usecase/webhook.transaction.usecase';

class WebhookTransactionRoutes {
  public prefix_route = '/api/v1';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: TransactionWebhookEvent; }>(
      '/deposit/auto',
      {
        preValidation: [
          (fastify as any).webhook_transaction_auth,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const transaction = request.body;
          await webhookTransaction.saveDepositTransaction(transaction);

          return { acknowledge: true };
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default WebhookTransactionRoutes;
