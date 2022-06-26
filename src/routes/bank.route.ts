import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import responseHandler from '../helper/response.handler';

import bank from '../usecase/bank.usecase';

class BankRoutes {
  public prefix_route = '/bank';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.get('/list', { preValidation: [(fastify as any).auth_common_access_token] }, async (request, reply) => {
      responseHandler(async () => {
        const result = bank.companyList();

        return result;
      }, reply);

      await reply;
    });

    done();
  }
}

export default BankRoutes;
