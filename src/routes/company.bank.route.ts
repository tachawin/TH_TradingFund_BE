import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {
  CompanyBankBodyRequest,
  UpdateCompanyBankParams,
  DeleteCompanyBankBodyRequest,
  UpdateInformationCompanyBankBodyRequest,
  ListCompanyBankQueries,
} from '../entities/dtos/company_bank.dtos';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';
import { CompanyBankStatus } from '../entities/schemas/company_bank.schema';

import {
  companyBankInfoValidate,
  companyBankInformationUpdateValidate,
} from '../helper/company_bank.validator';
import responseHandler from '../helper/response.handler';

import companyBank from '../usecase/company.bank.usecase';

class CompanyBankRoutes {
  public prefix_route = '/company_bank';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: CompanyBankBodyRequest }>(
      '/create',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            bank: '1100',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { body: bankInfo } = request;

          companyBankInfoValidate(bankInfo);

          const data = await companyBank.createCompanyBank(bankInfo);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListCompanyBankQueries }>(
      '/list',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            bank: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const filters = request.query;
          let parsedFilter = { ...filters };

          const { bank, type, status } = filters;
          if (bank && typeof bank === 'string') {
            parsedFilter = { ...filters, bank: bank.split(',') };
          }

          if (type && typeof type === 'string') {
            parsedFilter = { ...filters, type: type.split(',') };
          }

          if (status && typeof status === 'string') {
            parsedFilter = { ...filters, status: status.split(',') as CompanyBankStatus[] };
          }

          const data = await companyBank.findCompanyBankList(parsedFilter);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.delete<{ Body: DeleteCompanyBankBodyRequest }>(
      '/delete',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            bank: '1011',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { bankId } = request.body;

          const deleted = await companyBank.deleteCompanyBank(bankId);
          if (!deleted) {
            return { code: 204, message: 'company bank not exist, please contact super company bank' };
          }

          return { code: 202, message: 'deleted company bank successfully' };
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: UpdateInformationCompanyBankBodyRequest, Params: UpdateCompanyBankParams }>(
      '/update/:bankId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            bank: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { bankId } = request.params as UpdateCompanyBankParams;
          const infoChange = request.body;

          companyBankInformationUpdateValidate(infoChange);

          const newCompanyBank = await companyBank.updateCompanyBank(bankId, infoChange);

          return newCompanyBank;
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default CompanyBankRoutes;
