/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

export type ProductStatusActive = 'active';
export type ProductStatusDeleted = 'deleted';
export type ProductStatus = ProductStatusActive | ProductStatusDeleted;

export enum ProductStatusConstant {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

export interface Product {
  productId?: string
  name: string
  imageURL: string
  description?: string
  point: number
  quantity: number
  adminId: string
  status?: ProductStatus
  createdAt?: Date
  updatedAt?: Date
}

export type ProductResponse = Promise<Product>;
export type ProductListResponse = Promise<Product[]>;
export type ProductDocument = Product & mongoose.Document;

const schema = new mongoose.Schema<Product>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    imageURL: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    point: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ productId: 1 }, { unique: true });

schema.index({ name: 1 });
schema.index({ description: 1 });
schema.index({ point: 1 });
schema.index({ quantity: 1 });

schema.index({ createdAt: 1 });

export const ProductSchema = schema;
