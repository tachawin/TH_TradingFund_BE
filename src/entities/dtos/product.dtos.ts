import { MongoMatchFilter } from '../interfaces/helper/mongo.types';
import { ProductStatus } from '../schemas/product.schema';

export interface ProductBodyRequest {
  imageURL: string
  name: string
  description?: string
  point: number
  quantity: number
}

export interface UpdateProductParams {
  productId: string
}

export interface DeleteProductBodyRequest {
  productId: string
}

export interface UpdateProductDTO {
  imageURL?: string
  name?: string
  description?: string
  point?: number
  quantity?: number
}

export type UpdateInformationProductBodyRequest = UpdateProductDTO

export interface ProductListFilterDTO {
  minPoint?: number
  maxPoint?: number
  minQuantity?: number
  maxQuantity?: number
  keyword?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface ProductListFilter {
  status?: ProductStatus | MongoMatchFilter<ProductStatus>
  point?: number
  quantity?: number
  keyword?: string
}

export type ListProductQueries = ProductListFilterDTO;
