import AWSAdapter from '../adapters/aws.adapter';

import { ProductListFilterDTO, UpdateProductDTO } from '../entities/dtos/product.dtos';
import { Product, ProductListResponse, ProductResponse } from '../entities/schemas/product.schema';

import { LError } from '../helper/errors.handler';

import ProductRepository from '../repositories/product.repository';

const awsAdapter = AWSAdapter.getInstance();

const product = ProductRepository.getInstance();

async function createProduct(productInfo: Product): ProductResponse {
  try {
    const newProduct = await product.createProduct(productInfo);

    return newProduct;
  } catch (error) {
    throw LError('[ProductUsecase.createProduct]: unable to create product', error);
  }
}

async function uploadProductPreview(stream: any): Promise<string> {
  try {
    const [productPreviewUploader, objectURL] = awsAdapter.s3().productPreviewUploader();
    const { writeStream, promise } = awsAdapter.s3().uploadSteam(productPreviewUploader);

    stream.pipe(writeStream);

    await promise;

    return objectURL;
  } catch (error) {
    throw LError('[ProductUsecase.uploadProductPreview]: an error occurred during upload', error);
  }
}

async function findProductList(filters: ProductListFilterDTO): ProductListResponse {
  try {
    const products = await product.findAllProduct(filters);

    return products;
  } catch (error) {
    throw LError('[ProductUsecase.findProductList]: unable to find all product', error);
  }
}

async function findProductListForCustomer(filters: ProductListFilterDTO): ProductListResponse {
  try {
    const products = await product.findAllProduct(filters, {
      quantity: 0, adminId: 0, status: 0, createdAt: 0, updatedAt: 0,
    });

    return products;
  } catch (error) {
    throw LError('[ProductUsecase.findProductList]: unable to find all product', error);
  }
}

async function updateProduct(productId: string, newProductInfo: UpdateProductDTO): ProductResponse {
  try {
    const updatedProduct = await product.updateProduct(productId, newProductInfo);

    return updatedProduct;
  } catch (error) {
    throw LError('[ProductUsecase.updateProduct]: unable to update product information', error);
  }
}

async function deleteProduct(productId: string): Promise<boolean> {
  try {
    const updatedCount = await product.softDeleteProduct(productId);
    if (updatedCount === 0) {
      return false;
    }

    return true;
  } catch (error) {
    throw LError('[ProductUsecase.deleteProduct]: unable to delete product', error);
  }
}

export default {
  createProduct,
  uploadProductPreview,
  findProductList,
  findProductListForCustomer,
  updateProduct,
  deleteProduct,
};
