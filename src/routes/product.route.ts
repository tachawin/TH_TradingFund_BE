import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {
  ProductBodyRequest,
  ListProductQueries,
  UpdateProductParams,
  DeleteProductBodyRequest,
} from '../entities/dtos/product.dtos';
import { AdminAccessTokenPayload } from '../entities/interfaces/data/token.interface';
import { AdminStatusConstant } from '../entities/schemas/admin.schema';

import responseHandler from '../helper/response.handler';

import product from '../usecase/product.usecase';

class ProductRoutes {
  public prefix_route = '/product';

  async routes(fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
    fastify.post<{ Body: ProductBodyRequest }>(
      '/create',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            product: '1100',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { body: productInfo } = request;
          const { adminId } = request.user as AdminAccessTokenPayload;

          const data = await product.createProduct({
            ...productInfo,
            adminId,
          });

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.post<{ Body: { productId: string, file: any} }>(
      '/upload/preview',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            product: '1110',
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

          const { file } = await request.file();

          const objectURL = await product.uploadProductPreview(file);

          return { productPreviewPictureURL: objectURL };
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListProductQueries }>(
      '/list',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            product: '1000',
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

          const data = await product.findProductList(filters);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.get<{ Querystring: ListProductQueries }>(
      '/redeemable_items',
      {
        preValidation: [
          (fastify as any).auth_customer_access_token,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const filters = request.query;

          filters.minQuantity = 1;

          const data = await product.findProductListForCustomer(filters);

          return data;
        }, reply);

        await reply;
      },
    );

    fastify.delete<{ Body: DeleteProductBodyRequest }>(
      '/delete',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            product: '1011',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { productId } = request.body;

          const deleted = await product.deleteProduct(productId);
          if (!deleted) {
            return { code: 204, message: 'product not exist, please contact super product' };
          }

          return { code: 202, message: 'deleted product successfully' };
        }, reply);

        await reply;
      },
    );

    fastify.patch<{ Body: ProductBodyRequest, Params: UpdateProductParams }>(
      '/update/:productId',
      {
        config: {
          requiredStatus: AdminStatusConstant.ACTIVE,
          requiredFeatures: {
            product: '1010',
          },
        },
        preValidation: [
          (fastify as any).auth_admin_access_token,
          (fastify as any).enrich_features_permission,
        ],
      },
      async (request, reply) => {
        responseHandler(async () => {
          const { productId } = request.params as UpdateProductParams;
          const infoChange = request.body;

          const newProduct = await product.updateProduct(productId, infoChange);

          return newProduct;
        }, reply);

        await reply;
      },
    );

    done();
  }
}

export default ProductRoutes;
