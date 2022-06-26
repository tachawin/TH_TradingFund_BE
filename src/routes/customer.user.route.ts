import {
  FastifyInstance, FastifyPluginOptions,
} from 'fastify';

import {
  CustomerSendOTPRequest,
  CustomerUserFormatRequest,
  CustomerVerifyCustomerWithOTPRequest,
} from '../entities/dtos/auth.dtos';
import {
  CustomerBodyRequest,
  ListCustomerQueries,
  AddressIdParams,
  CustomerAddressBodyRequest,
} from '../entities/dtos/customer.dtos';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';

import { customerInfoValidate } from '../helper/customer.validator';
import { hashing } from '../helper/hash.handler';
import responseHandler from '../helper/response.handler';

import customerAuth from '../usecase/customer.auth.usecase';
import customer from '../usecase/customer.usecase';
import referralList from '../usecase/referral.list.usecase';

class CustomerUserRoutes {
  public prefix_route = '/customer';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: CustomerBodyRequest }>(
      '/register',
      async (request, reply) => {
        responseHandler(async () => {
          let isRefCodeValid = false;
          const { body: customerInfo } = request;

          const {
            name, mobileNumber, password, bankName, ref,
          } = customerInfo;

          customerInfoValidate(customerInfo);

          if (ref) {
            isRefCodeValid = await customer.validateRefCode(ref);
          }

          const passwordHashed = hashing(password);

          const data = await customer.createCustomer({
            ...customerInfo,
            password: passwordHashed,
            bankAccountName: name,
            bankName: bankName.toLocaleLowerCase(),
            referralLink: mobileNumber,
          });

          if (isRefCodeValid) {
            await referralList.newReferralList(data.customerId, ref);
            await referralList.updateRelatedReferralList(ref, data.mobileNumber);
          } else {
            await referralList.newReferralList(data.customerId);
          }

          const [refreshToken, accessToken] = await customerAuth.customerLogin(mobileNumber, password);

          return { ...data, refreshToken, accessToken };
        }, reply);

        await reply;
      },
    );

    fastify.post<{ Body: CustomerSendOTPRequest }>('/send/otp', async (request, reply) => {
      responseHandler(async () => {
        const { body: { mobileNumber } } = request;

        const newRefCode = await customerAuth.customerSendOneTimePassword(mobileNumber);

        return { status: 'success', refCode: newRefCode };
      }, reply);

      await reply;
    });

    fastify.post<{ Body: CustomerVerifyCustomerWithOTPRequest }>('/verify/otp', async (request, reply) => {
      responseHandler(async () => {
        const { body: { mobileNumber, refCode, otpConfirm } } = request;

        const status = await customerAuth.customerVerifyWithOTP(mobileNumber, refCode, otpConfirm);

        reply.send({ code: 200, status });
      }, reply);

      await reply;
    });

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

    fastify.get(
      '/user',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { customerId } = request.user as CustomerUserFormatRequest;

          const data = await customer.findCustomerByCustomerID(customerId);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get(
      '/referral_list',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { customerId } = request.user as CustomerUserFormatRequest;
          const result = await referralList.getReferralListById(customerId);
          return result;
        }, reply);

        await reply;
      },
    );

    fastify.post<{ Body: CustomerAddressBodyRequest }>(
      '/address',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { customerId } = request.user as CustomerUserFormatRequest;
          const newCustomerAddress = request.body;
          const data = await customer.addCustomerAddress(customerId, newCustomerAddress);

          return { status: 'success', customer: data };
        }, reply);

        await reply;
      },
    );

    fastify.delete<{ Params: AddressIdParams }>(
      '/address/:addressId',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { customerId } = request.user as CustomerUserFormatRequest;
          const { addressId } = request.params;
          const data = await customer.deleteCustomerAddress(customerId, addressId);

          return { status: 'success', customer: data };
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Params: AddressIdParams }>(
      '/address/present/:addressId',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { customerId } = request.user as CustomerUserFormatRequest;
          const { addressId } = request.params;
          const data = await customer.updateCustomerPresentAddress(customerId, addressId);

          return { status: 'success', customer: data };
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default CustomerUserRoutes;
