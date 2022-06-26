/* eslint-disable no-param-reassign */
import ExcelJS from 'exceljs';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {
  DashboardReportTransactionByDateQueries,
  ListReportQueries,
} from '../entities/dtos/report.transaction.dto';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';
import { SHEET_COLUMNS_TRANSACTION, TransactionType } from '../entities/schemas/transaction.schema';

import { toFilterTransactionUseBankFullName } from '../helper/bank.handler';
import responseHandler from '../helper/response.handler';

import report from '../usecase/report.transaction.usecase';

class ReportTransactionRoutes {
  public prefix_route = '/transaction/report';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.get<{ Querystring: ListReportQueries; }>(
      '/list',
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

          const { bankName, transactionType } = filters;
          if (bankName && typeof bankName === 'string') {
            parsedFilter = toFilterTransactionUseBankFullName({ ...parsedFilter, bankName: bankName.split(',') });
          }

          if (transactionType && typeof transactionType === 'string') {
            parsedFilter = { ...parsedFilter, transactionType: transactionType.split(',') as TransactionType[] };
          }

          const result = await report.listReportTransaction(parsedFilter);

          return result;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListReportQueries; }>(
      '/list/excel/export',
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

          const { bankName } = filters;
          if (bankName && typeof bankName === 'string') {
            parsedFilter = toFilterTransactionUseBankFullName({ ...filters, bankName: bankName.split(',') });
          }

          const result = await report.listReportTransaction(parsedFilter);

          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('report_transaction');

          worksheet.columns = SHEET_COLUMNS_TRANSACTION;
          worksheet.addRows(result);

          reply.raw.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          reply.raw.writeHead(200, { 'Content-Disposition': 'attachment; filename=report_transaction.xlsx' });

          await workbook.xlsx.write(reply.raw);

          reply.sent = true;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: DashboardReportTransactionByDateQueries }>(
      '/dashboard/metric/sum',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            deposit: '1000',
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
          const { date } = request.query;

          let dateFilter = new Date().toISOString().split('T')[0];
          if (date) {
            dateFilter = date;
          }

          const result = await report.getAmountTransactionByDay(dateFilter);

          return result;
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default ReportTransactionRoutes;
