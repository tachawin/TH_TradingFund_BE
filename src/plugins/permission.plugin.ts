/* eslint-disable dot-notation */
/* eslint-disable array-callback-return */
import { FastifyInstance, FastifyPluginOptions, FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import RedisAdapter from '../adapters/redis.adapter';

import { AdminRoleConstant } from '../entities/schemas/admin.schema';

import { LError } from '../helper/errors.handler';
import { responseSender } from '../helper/response.handler';
import parseResponse from '../helper/response.parser';

const redisClient = RedisAdapter.getInstance();

function toPermission(flag: string): number {
  return parseInt(flag, 10);
}

const featuresPlugin = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: any) => {
  fastify.decorate('enrich_features_permission', async (request: any, reply: FastifyReply) => {
    try {
      const { adminId } = request.user;

      const keyVerifyAdminPermission = redisClient.getKeyVerifyAdminPermission(adminId);
      const permissionState = await redisClient.getJSON(keyVerifyAdminPermission);

      const { status, role, features } = permissionState;

      const { requiredFeatures, requiredStatus, requiredRole } = reply.context.config as any;

      const featuresPermission = {};
      Object.keys(features).map((featureName) => {
        featuresPermission[featureName] = {};
        featuresPermission[featureName].read = toPermission(features[featureName][0]);
        featuresPermission[featureName].create = toPermission(features[featureName][1]);
        featuresPermission[featureName].update = toPermission(features[featureName][2]);
        featuresPermission[featureName].remove = toPermission(features[featureName][3]);
      });

      request.user.featurePermission = featuresPermission;

      if (requiredStatus && status !== requiredStatus) {
        throw LError('[FeaturesPlugin.enrich_features_permission]: permission denied, your status do not have access permission to this endpoint');
      }

      if (requiredRole) {
        const isSuperAdmin = role === AdminRoleConstant.SUPER_ADMIN;

        if (!isSuperAdmin && role !== AdminRoleConstant.ADMIN) {
          throw LError('[FeaturesPlugin.enrich_features_permission]: permission denied, your role do not have access permission to this endpoint');
        }
      }

      if (!requiredFeatures) {
        return;
      }

      Object.keys(requiredFeatures).map((featureName) => {
        const requiredRead = toPermission(requiredFeatures[featureName][0]);
        if (requiredRead > featuresPermission[featureName].read) {
          throw LError(`[FeaturesPlugin.enrich_features_permission]: permission denied, you don't have access read permission to this ${featureName} feature`);
        }

        const requiredCreate = toPermission(requiredFeatures[featureName][1]);
        if (requiredCreate > featuresPermission[featureName].create) {
          throw LError(`[FeaturesPlugin.enrich_features_permission]: permission denied, you don't have access create permission to this ${featureName} feature`);
        }

        const requiredUpdate = toPermission(requiredFeatures[featureName][2]);
        if (requiredUpdate > featuresPermission[featureName].update) {
          throw LError(`[FeaturesPlugin.enrich_features_permission]: permission denied, you don't have access update permission to this ${featureName} feature`);
        }

        const requiredRemove = toPermission(requiredFeatures[featureName][3]);
        if (requiredRemove > featuresPermission[featureName].remove) {
          throw LError(`[FeaturesPlugin.enrich_features_permission]: permission denied, you don't have access remove permission to this ${featureName} feature`);
        }
      });
    } catch (error) {
      LError('[FeaturesPlugin.enrich_features_permission]: unable to access resource', error);

      responseSender(parseResponse({
        code: 401,
        message: error.message.split(': ')[1],
      }), reply);
    }
  });

  done();
};

export default fastifyPlugin(featuresPlugin);
