import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { AdminUserFormatRequest, CustomerUserFormatRequest } from '../entities/dtos/auth.dtos';
import {
  DepositIdentifyParams,
  ListDepositQueries,
  UpdateDepositNoteRequest,
  UpdateDepositCustomerRequest,
  DepositActionBodyRequest,
} from '../entities/dtos/deposit.transaction.dtos';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';
import { TransactionStatus } from '../entities/schemas/transaction.schema';

import { toFilterTransactionUseBankFullName } from '../helper/bank.handler';
import responseHandler from '../helper/response.handler';

import deposit from '../usecase/deposit.transaction.usecase';

class DepositTransactionRoutes {
  public prefix_route = '/transaction/deposit';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.get<{ Querystring: ListDepositQueries; }>(
      '/admin/list',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            deposit: '1000',
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

          const { bankName, companyBankId, status } = filters;
          if (bankName && typeof bankName === 'string') {
            parsedFilter = toFilterTransactionUseBankFullName({ ...filters, bankName: bankName.split(',') });
          }

          if (companyBankId && typeof companyBankId === 'string') {
            parsedFilter = { ...parsedFilter, companyBankId: companyBankId.split(',') };
          }

          if (status && typeof status === 'string') {
            parsedFilter = { ...parsedFilter, status: status.split(',') as TransactionStatus[] };
          }

          const result = await deposit.listDepositTransaction(parsedFilter);

          return result;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListDepositQueries }>(
      '/customer/list',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const filters = request.query;

          const { customerId } = request.user as CustomerUserFormatRequest;
          if (!customerId) {
            return { code: 400, message: 'customer id not exist' };
          }

          let parsedFilter: ListDepositQueries = { ...filters, customerId };
          const { bankName } = filters;
          if (bankName && typeof bankName === 'string') {
            parsedFilter = toFilterTransactionUseBankFullName({ ...filters, bankName: bankName.split(',') });
          }

          const result = await deposit.listDepositTransactionForCustomer(parsedFilter);

          return result;
        }, reply);

        await reply;
      },
    );

    fastify.post<{ Body: DepositActionBodyRequest; }>(
      '/action',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            deposit: '1100',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { adminId } = request.user as AdminUserFormatRequest;
          const transaction = request.body;

          const result = await deposit.actionDepositTransaction(transaction, adminId);

          return result;
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: UpdateDepositNoteRequest, Params: DepositIdentifyParams; }>(
      '/note/:transactionId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            deposit: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { adminId } = request.user as AdminUserFormatRequest;
          const { transactionId } = request.params;
          const { notes } = request.body;

          if (!transactionId) {
            return { code: 400, message: 'transaction id not exist on params' };
          }

          const modifiedCount = await deposit.updateNoteDeposit(transactionId, notes, adminId);

          return { transactionModifiedCount: modifiedCount };
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: UpdateDepositCustomerRequest, Params: DepositIdentifyParams; }>(
      '/pick/customer/:transactionId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            deposit: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { adminId } = request.user as AdminUserFormatRequest;
          const { transactionId } = request.params;
          const updateTransaction = request.body;

          if (!transactionId) {
            return { code: 400, message: 'transactionId not exist on params' };
          }

          if (!updateTransaction.mobileNumber) {
            return { code: 400, message: 'mobileNumber not exist on payload' };
          }

          const modifiedCount = await deposit.pickCustomerDeposit(transactionId, updateTransaction, adminId);

          return { transactionModifiedCount: modifiedCount };
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: UpdateDepositNoteRequest, Params: DepositIdentifyParams; }>(
      '/waive/:transactionId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            deposit: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { adminId } = request.user as AdminUserFormatRequest;
          const { transactionId } = request.params;
          const { notes } = request.body;

          if (!transactionId) {
            return { code: 400, message: 'transactionId not exist on params' };
          }

          if (!notes) {
            return { code: 400, message: 'notes not exist on payload' };
          }

          const modifiedCount = await deposit.waiveDeposit(transactionId, notes, adminId);

          return { transactionModifiedCount: modifiedCount };
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default DepositTransactionRoutes;
