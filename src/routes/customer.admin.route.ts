import {
  FastifyInstance, FastifyPluginOptions,
} from 'fastify';

import {
  CustomerBodyRequest,
  GetCustomerByIdParams,
  ListCustomerQueries,
  DashboardCustomerRegisterAndActionQueries,
} from '../entities/dtos/customer.dtos';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';

import { customerInfoValidate } from '../helper/customer.validator';
import { hashing } from '../helper/hash.handler';
import responseHandler from '../helper/response.handler';
import {
  addHoursToDate,
  timeFilterToDateTHTimeZoneFloor,
} from '../helper/time.handler';

import customer from '../usecase/customer.usecase';
import referralList from '../usecase/referral.list.usecase';

class CustomerAdminRoutes {
  public prefix_route = '/customer_admin';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: CustomerBodyRequest }>(
      '/create',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            customer: '1100',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          let isRefCodeValid = false;
          const { body: customerInfo } = request;

          const { name, mobileNumber, ref } = customerInfo;

          customerInfoValidate(customerInfo);

          if (ref) {
            isRefCodeValid = await customer.validateRefCode(ref);
          }

          const passwordHashed = hashing(customerInfo.password);

          const data = await customer.createCustomer({
            ...customerInfo,
            password: passwordHashed,
            bankAccountName: name,
            referralLink: mobileNumber,
          });

          if (isRefCodeValid) {
            await referralList.newReferralList(data.customerId, ref);
            await referralList.updateRelatedReferralList(ref, data.mobileNumber);
          } else {
            await referralList.newReferralList(data.customerId);
          }
          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListCustomerQueries }>(
      '/list',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            customer: '1000',
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

          const { bank, level } = filters;
          if (bank && typeof bank === 'string') {
            parsedFilter = { ...filters, bank: bank.split(',') };
          }
          if (level && typeof level === 'string') {
            parsedFilter = { ...filters, level: level.split(',') };
          }

          const data = await customer.findCustomerList(parsedFilter);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Params: GetCustomerByIdParams }>(
      '/:customerId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            customer: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { customerId } = request.params;

          const data = await customer.findCustomerByCustomerID(customerId);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{Params: GetCustomerByIdParams }>(
      '/referral_list/:customerId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            customer: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { customerId } = request.params;
          const result = await referralList.getReferralListById(customerId);
          return result;
        }, reply);

        await reply;
      },
    );

    fastify.get(
      '/mobile_number/list',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            customer: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const data = await customer.findCustomerMobileNumberList();

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: DashboardCustomerRegisterAndActionQueries }>(
      '/dashboard/metric/regis_and_action',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            customer: '1000',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { dateStart, dateEnd } = request.query;

          const today = addHoursToDate(new Date(), 7);
          let dateEndFilter = today.toISOString().split('T')[0];
          if (dateEnd) {
            dateEndFilter = dateEnd;
          }

          const refDate = timeFilterToDateTHTimeZoneFloor(dateEndFilter);

          let dateStartFilter = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 6, refDate.getHours() + 7).toISOString().split('T')[0];
          if (dateStart) {
            dateStartFilter = dateStart;
          }

          const result = await customer.getAmountCustomerRegisterByDay(dateStartFilter, dateEndFilter);

          return result;
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default CustomerAdminRoutes;
