/* eslint-disable no-case-declarations */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {
  AdminUserFormatRequest,
  CustomerUserFormatRequest,
} from '../entities/dtos/auth.dtos';
import {
  ListWithdrawQueries,
  WithdrawTypeParams,
  WithdrawRequestBody,
  WithdrawActonManualBodyRequest,
} from '../entities/dtos/withdraw.transaction.dtos';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';
import { TransactionStatus } from '../entities/schemas/transaction.schema';

import { toFilterTransactionUseBankFullName } from '../helper/bank.handler';
import responseHandler from '../helper/response.handler';

import withdraw from '../usecase/withdraw.transaction.usecase';

class WithdrawTransactionRoutes {
  public prefix_route = '/transaction/withdraw';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.get<{ Querystring: ListWithdrawQueries, Params: WithdrawTypeParams }>(
      '/admin/list/:withdrawType',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            withdraw: '1000',
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
          const { withdrawType } = request.params;

          let parsedFilter = { ...filters };

          const { bankName, status, companyBankId } = filters;
          if (bankName && typeof bankName === 'string') {
            parsedFilter = toFilterTransactionUseBankFullName({ ...parsedFilter, bankName: bankName.split(',') });
          }

          if (companyBankId && typeof companyBankId === 'string') {
            parsedFilter = { ...parsedFilter, companyBankId: companyBankId.split(',') };
          }

          if (status && typeof status === 'string') {
            parsedFilter = { ...parsedFilter, status: status.split(',') as TransactionStatus[] };
          }

          const result = await withdraw.listWithdrawTransaction(withdrawType, parsedFilter);

          return result;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListWithdrawQueries, Params: WithdrawTypeParams }>(
      '/customer/list/:withdrawType',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const filters = request.query;
          const { withdrawType } = request.params;

          const { customerId } = request.user as CustomerUserFormatRequest;
          if (!customerId) {
            return { code: 400, message: 'customer id not exist' };
          }

          if (!withdrawType) {
            return { code: 400, message: 'withdraw type not exist on params' };
          }

          let parsedFilter: ListWithdrawQueries = { ...filters, customerId };
          const { bankName } = filters;
          if (bankName && typeof bankName === 'string') {
            parsedFilter = toFilterTransactionUseBankFullName({ ...parsedFilter, bankName: bankName.split(',') });
          }

          const result = await withdraw.listWithdrawTransactionForCustomer(withdrawType, parsedFilter);

          return result;
        }, reply);

        await reply;
      },
    );

    fastify.post<{ Body: WithdrawRequestBody; }>(
      '/request',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const transaction = request.body;

          const [data, err] = await withdraw.requestWithdrawTransaction(transaction);
          if (err) {
            reply.send({ code: 204, status: 'failed', msg: err.message });
          }

          reply.send({ code: 201, status: 'success', data });
        }, reply);

        await reply;
      },
    );

    fastify.post<{ Body: { transactionId: string}; }>(
      '/request/cancel',
      {
        preValidation: [
          (fastify as any).auth_admin_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { transactionId } = request.body;

          if (!transactionId) {
            return { code: 400, message: 'transaction id required' };
          }

          await withdraw.cancelRequestWithdrawTransaction(transactionId);

          return { acknowledge: true };
        }, reply);

        await reply;
      },
    );

    fastify.post(
      '/upload/payslip',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            withdraw: '1110',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          if (!request.isMultipart()) {
            return { code: 400, message: 'unable to upload the image, request is not multipart' };
          }

          const { adminId } = request.user as AdminUserFormatRequest;
          const { file } = await request.file();

          const objectURL = await withdraw.uploadPayslipWithdraw(file, adminId);

          return { payslipPictureURL: objectURL };
        }, reply);

        await reply;
      },
    );

    fastify.post<{ Body: WithdrawActonManualBodyRequest; Params: { actionType: 'auto' | 'manual' }}>(
      '/action/:actionType',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            withdraw: '1100',
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
          const { actionType } = request.params;
          const transaction = request.body;

          switch (actionType) {
            case 'manual':
              if (!transaction.payslipPictureURL) {
                return { code: 400, message: 'admin must to attach payslip image URL to confirm the transaction' };
              }
              const [manualData, manualErr] = await withdraw.actionWithdrawTransactionManual(transaction, adminId);

              if (manualErr) {
                return { code: 204, err: manualErr.message };
              }

              return { code: 201, data: manualData };
            case 'auto':
              const [autoData, autoErr] = await withdraw.actionWithdrawTransactionAutomatic(transaction, adminId);

              if (autoErr) {
                return { code: 204, err: autoErr };
              }

              return { code: 201, data: autoData };
            default:
              return { code: 400, message: 'action type not support' };
          }
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default WithdrawTransactionRoutes;
