import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { ACTION } from '../entities/constants/action';
import {
  AdminBodyRequest,
  ListAdminQueries,
  UpdateAdminParams,
  DeleteActionAdminParams,
  DeleteAdminBodyRequest,
  UpdateInformationAdminBodyRequest,
} from '../entities/dtos/admin.dtos';
import { AdminAccessTokenPayload } from '../entities/interfaces/data/token.interface';
import {
  AdminRoleConstant,
  AdminStatusConstant,
  AdminRole,
  AdminStatus,
} from '../entities/schemas/admin.schema';
import { DEFAULT_FEATURES, FeatureAccessLevel } from '../entities/schemas/features.schema';

import {
  adminInfoValidate,
  adminInformationUpdateValidate,
  permissionValidate,
} from '../helper/admin.validator';
import { hashing } from '../helper/hash.handler';
import responseHandler from '../helper/response.handler';

import admin from '../usecase/admin.usecase';

class AdminRoutes {
  public prefix_route = '/admin';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: AdminBodyRequest }>(
      '/register',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            adminManage: '1100',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { body: adminInfo } = request;

          adminInfoValidate(adminInfo);

          const { role, status, features } = adminInfo;

          let adminFeatures: FeatureAccessLevel = DEFAULT_FEATURES.ADMIN;
          if (role === AdminRoleConstant.SUPER_ADMIN) {
            adminFeatures = DEFAULT_FEATURES.SUPER_ADMIN;
          }

          if (features) {
            adminFeatures = features;
          }

          let adminStatus: AdminStatus = AdminStatusConstant.ACTIVE;
          if (status) {
            adminStatus = status;
          }

          const passwordHashed = hashing(adminInfo.password);

          const data = await admin.createAdmin({
            ...adminInfo,
            password: passwordHashed,
            status: adminStatus,
            features: adminFeatures,
          });

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListAdminQueries }>(
      '/list',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            adminManage: '1000',
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

          const { role } = filters;
          if (role && typeof role === 'string') {
            parsedFilter = { ...filters, role: role.split(',') as AdminRole[] };
          }

          const data = await admin.findAdminList(parsedFilter);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.delete<{ Body: DeleteAdminBodyRequest, Params: DeleteActionAdminParams }>(
      '/delete/:action',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredRole: AdminRoleConstant.SUPER_ADMIN,
          requiredFeatures: {
            adminManage: '1011',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { adminId } = request.body;
          const { action } = request.params;

          let deleteAction = ACTION.DELETE.SOFT;
          if (action) {
            deleteAction = action;
          }

          const deleted = await admin.deleteAdmin(adminId, deleteAction);
          if (!deleted) {
            return { code: 204, message: 'admin not exist, please contact super admin' };
          }

          return { code: 202, message: 'deleted admin successfully' };
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: UpdateInformationAdminBodyRequest, Params: UpdateAdminParams }>(
      '/update/:adminId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredRole: AdminRoleConstant.SUPER_ADMIN,
          requiredFeatures: {
            adminManage: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { adminId } = request.params as AdminAccessTokenPayload;
          const infoChange = request.body;

          adminInformationUpdateValidate(infoChange);

          const newAdmin = await admin.updateAdmin(adminId, infoChange);

          return newAdmin;
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: FeatureAccessLevel, Params: UpdateAdminParams }>(
      '/permission/:adminId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredRole: AdminRoleConstant.SUPER_ADMIN,
          requiredFeatures: {
            adminManage: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { adminId } = request.params;
          const permissionChange = request.body;

          permissionValidate(permissionChange);

          const newPermission = await admin.updateAdminPermission(adminId, permissionChange);

          return newPermission;
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default AdminRoutes;
