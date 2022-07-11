/* eslint-disable no-use-before-define */
import { model, Model, FilterQuery } from 'mongoose';
import config from '../config/config';

import { ProductListFilter, ProductListFilterDTO, UpdateProductDTO } from '../entities/dtos/product.dtos';
import {
  Product,
  ProductDocument,
  ProductSchema,
  ProductResponse,
  ProductListResponse,
  ProductStatusConstant,
} from '../entities/schemas/product.schema';

import { LError } from '../helper/errors.handler';

class ProductRepository {
  private static instance: ProductRepository;
  private _model: Model<ProductDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.product;
    this._model = model<ProductDocument>(this.collection, ProductSchema);
  }

  public static getInstance(): ProductRepository {
    if (!ProductRepository.instance) {
      ProductRepository.instance = new ProductRepository();
    }

    return ProductRepository.instance;
  }

  public async createProduct(product: Product): ProductResponse {
    const mongooseModel = new this._model(product);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[ProductRepository.createProduct]: unable to save product to database', error);
    }
  }

  public async findAllProduct(listFilters?: ProductListFilterDTO, fields?: { [key: string]: number }): ProductListResponse {
    let query: FilterQuery<ProductDocument> = {};

    try {
      const {
        minPoint,
        maxPoint,
        minQuantity,
        maxQuantity,
        keyword,
        sortField,
        sortDirection,
      } = listFilters || {};

      const filters: ProductListFilter = {};

      let search = [];

      filters.status = { $in: [ProductStatusConstant.ACTIVE] };

      const pointFilter: FilterQuery<ProductDocument> = {};
      if (minPoint) {
        pointFilter.$gte = minPoint;
      }

      if (maxPoint) {
        pointFilter.$lte = maxPoint;
      }

      const quantityFilter: FilterQuery<ProductDocument> = {};
      if (minQuantity) {
        quantityFilter.$gte = minQuantity;
      }

      if (maxQuantity) {
        quantityFilter.$lte = maxQuantity;
      }

      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        search = [
          { name: regex },
          { description: regex },
        ];
      }

      const multiFilter = [];

      const isFilter = Object.keys(filters).length !== 0;
      if (isFilter) {
        multiFilter.push(filters);
      }

      const isMultiSearch = search.length !== 0;
      if (isMultiSearch) {
        multiFilter.push({ $or: search });
      }

      const pointFilterRange = Object.keys(pointFilter).length !== 0;
      if (pointFilterRange) {
        multiFilter.push({ point: pointFilter });
      }

      const quantityFilterRange = Object.keys(quantityFilter).length !== 0;
      if (quantityFilterRange) {
        multiFilter.push({ quantity: quantityFilter });
      }

      const isMultiFilter = multiFilter.length > 1;

      if (!isMultiFilter && isFilter) {
        query = { ...filters };
      }

      if (!isMultiFilter && isMultiSearch) {
        query = { $or: search };
      }

      if (!isMultiFilter && pointFilterRange) {
        query = { point: pointFilter };
      }

      if (!isMultiFilter && quantityFilterRange) {
        query = { quantity: quantityFilter };
      }

      if (isMultiFilter) {
        query = {
          $and: multiFilter,
        };
      }

      let sortOptions = {};
      if (sortField) {
        let direction = -1;

        if (sortDirection === 'asc') {
          direction = 1;
        }

        sortOptions = { [sortField]: direction };
      }

      if (Object.keys(sortOptions).length === 0) {
        sortOptions = { createdAt: -1 };
      }

      console.info(query, sortOptions);

      const result = await this._model.find(query, { _id: 0, password: 0, ...fields }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError('[ProductRepository.findAllProduct]: unable to find all product on database', error);
    }
  }

  public async findProductByProductID(productId: string): ProductResponse {
    try {
      const query = {
        productId,
      };
      const { _doc: result } = await this._model.findOne(query, { _id: 0 }) as any;

      return result;
    } catch (error) {
      throw LError(`[ProductRepository.findProductByProductID]: unable to find product with the product_id: ${productId}`, error);
    }
  }

  public async updateProduct(productId: string, newProductInfo: UpdateProductDTO): ProductResponse {
    try {
      const query = {
        productId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        newProductInfo,
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[ProductRepository.updateProduct]: unable to update product: ${productId}`, error);
    }
  }

  public async decreaseProductQuantity(productId: string, amount: number): ProductResponse {
    try {
      const query = {
        productId,
      };

      const result = await this._model.findOneAndUpdate(query, {
        $inc: { quantity: amount * -1 },
      });

      return result;
    } catch (error) {
      throw LError(`[ProductRepository.decreaseProductQuantity]: unable to decrease quantity by productId:${productId}, amount:${amount}`, error);
    }
  }

  public async softDeleteProduct(productId: string): Promise<number> {
    try {
      const query = {
        productId,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        status: ProductStatusConstant.DELETED,
      });

      return modifiedCount;
    } catch (error) {
      throw LError(`[ProductRepository.softDeleteProduct]: unable to delete product: ${productId}`, error);
    }
  }
}

export default ProductRepository;
