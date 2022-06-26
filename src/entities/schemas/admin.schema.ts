/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

import { FeatureAccessLevel, FeatureAccessLevelSchema } from './features.schema';
import { validateMobileNumber } from './validator';

export type AdminStatusActive = 'active';
export type AdminStatusInActive = 'inactive';
export type AdminStatusDeleted = 'deleted';
export type AdminStatus = AdminStatusActive | AdminStatusInActive | AdminStatusDeleted;

export type AdminRoleAdmin = 'admin';
export type AdminRoleSuperAdmin = 'super_admin'
export type AdminRole = AdminRoleAdmin | AdminRoleSuperAdmin;

export enum AdminStatusConstant {
  ACTIVE= 'active',
  INACTIVE= 'inactive',
  DELETED ='deleted',
}

export enum AdminRoleConstant {
  ADMIN= 'admin',
  SUPER_ADMIN= 'super_admin',
}

export interface Admin {
  adminId?: string
  username: string
  password: string
  name: string
  mobileNumber: string
  role: AdminRole
  status: AdminStatus
  features?: FeatureAccessLevel
  createdAt?: Date
  updatedAt?: Date
}

type AdminSaveResult = Omit<Admin, 'password'>;

export type AdminSaveResponse = Promise<AdminSaveResult>;
export type AdminResponse = Promise<Admin>;
export type AdminListResponse = Promise<Admin[]>;

export type AdminDocument = Admin & mongoose.Document;

const schema = new mongoose.Schema<Admin>(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      validate: validateMobileNumber,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
    },
    features: {
      type: FeatureAccessLevelSchema,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ adminId: 1 }, { unique: true });
schema.index({ username: 1 }, { unique: true });
schema.index({ mobileNumber: 1 }, { unique: true });

schema.index({ username: 1, status: 1, role: 1 });
schema.index({ status: 1, role: 1, createdAt: 1 });
schema.index({
  status: 1, role: 1, username: 1, name: 1, mobileNumber: 1, createdAt: 1,
});

schema.index({ name: 1 });

schema.index({ createdAt: 1 });

export const AdminSchema = schema;
