/* eslint-disable no-use-before-define */
import { model, Model, FilterQuery } from 'mongoose';

import config from '../config/config';

import {
  AdminListFilterDTO,
  AdminListFilter,
  UpdateAdminDTO,
} from '../entities/dtos/admin.dtos';
import {
  Admin,
  AdminDocument,
  AdminSchema,
  AdminResponse,
  AdminListResponse,
  AdminStatusConstant,
} from '../entities/schemas/admin.schema';
import { FeatureAccessLevel } from '../entities/schemas/features.schema';

import { LError } from '../helper/errors.handler';
import { timeFilterToDateTHTimeZoneCeil, timeFilterToDateTHTimeZoneFloor } from '../helper/time.handler';

class AdminRepository {
  private static instance: AdminRepository;
  private _model: Model<AdminDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.admin;
    this._model = model<AdminDocument>(this.collection, AdminSchema);
  }

  public static getInstance(): AdminRepository {
    if (!AdminRepository.instance) {
      AdminRepository.instance = new AdminRepository();
    }

    return AdminRepository.instance;
  }

  public async createAdmin(admin: Admin): AdminResponse {
    const mongooseModel = new this._model(admin);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[AdminRepository.createAdmin]: unable to save admin to database', error);
    }
  }

  public async findAllAdmin(listFilters?: AdminListFilterDTO): AdminListResponse {
    let query: FilterQuery<AdminDocument> = {};

    try {
      const {
        status,
        role,
        startCreated,
        endCreated,
        startUpdated,
        endUpdated,
        keyword,
        sortField,
        sortDirection,
      } = listFilters || {};

      const filters: AdminListFilter = {};

      filters.status = { $in: [AdminStatusConstant.ACTIVE, AdminStatusConstant.INACTIVE] };
      if (status) {
        filters.status = status;
      }

      if (role?.length > 0 && typeof role !== 'string') {
        filters.role = {
          $in: role,
        };
      }

      const createdFilter: FilterQuery<AdminDocument> = {};
      if (startCreated) {
        createdFilter.$gte = timeFilterToDateTHTimeZoneFloor(startCreated);
      }
      if (endCreated) {
        createdFilter.$lte = timeFilterToDateTHTimeZoneCeil(endCreated);
      }

      const updatedFilter: FilterQuery<AdminDocument> = {};
      if (startUpdated) {
        updatedFilter.$gte = timeFilterToDateTHTimeZoneFloor(startUpdated);
      }
      if (endUpdated) {
        updatedFilter.$lte = timeFilterToDateTHTimeZoneCeil(endUpdated);
      }

      let search = [];
      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        search = [
          { username: regex },
          { mobileNumber: regex },
          { name: regex },
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

      const isCreatedFilterTimeRange = Object.keys(createdFilter).length !== 0;
      if (isCreatedFilterTimeRange) {
        multiFilter.push({ createdAt: createdFilter });
      }

      const isUpdatedFilterTimeRange = Object.keys(updatedFilter).length !== 0;
      if (isUpdatedFilterTimeRange) {
        multiFilter.push({ updatedAt: updatedFilter });
      }

      const isMultiFilter = multiFilter.length > 1;

      if (!isMultiFilter && isFilter) {
        query = { ...filters };
      }

      if (!isMultiFilter && isMultiSearch) {
        query = { $or: search };
      }

      if (!isMultiFilter && isCreatedFilterTimeRange) {
        query = { createdAt: createdFilter };
      }

      if (!isMultiFilter && isUpdatedFilterTimeRange) {
        query = { updatedAt: updatedFilter };
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

      // console.log(query, sortOptions);

      const result = await this._model.find(query, { _id: 0, password: 0 }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError(`[AdminRepository.findAllAdmin]: unable to find all admin on database with query:${query}`, error);
    }
  }

  public async findAdminByAdminID(adminId: string): AdminResponse {
    try {
      const query = {
        adminId,
        status: AdminStatusConstant.ACTIVE,
      };
      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[AdminRepository.findAdminByAdminID]: unable to find admin with the admin_id: ${adminId}`, error);
    }
  }

  public async findAdminByUsername(username: string): AdminResponse {
    try {
      const query = {
        username,
        status: AdminStatusConstant.ACTIVE,
      };

      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[AdminRepository.findAdminByUsername]: unable to find admin with the username: ${username}`, error);
    }
  }

  public async updateAdmin(adminId: string, newAdminInfo: UpdateAdminDTO): AdminResponse {
    try {
      const query = {
        adminId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        newAdminInfo,
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[AdminRepository.softDeleteAdmin]: unable to update admin: ${adminId}`, error);
    }
  }

  public async updatePermissionAdmin(adminId: string, newPermission: FeatureAccessLevel): AdminResponse {
    try {
      const query = {
        adminId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        { features: newPermission },
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[AdminRepository.updatePermissionAdmin]: unable to update admin permission: ${adminId}`, error);
    }
  }

  public async hardDeleteAdmin(adminId: string): Promise<number> {
    try {
      const query = {
        adminId,
      };

      const { deletedCount } = await this._model.deleteOne(query);

      return deletedCount;
    } catch (error) {
      throw LError(`[AdminRepository.hardDeleteAdmin]: unable to delete admin: ${adminId}`, error);
    }
  }

  public async softDeleteAdmin(adminId: string): Promise<number> {
    try {
      const query = {
        adminId,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        status: AdminStatusConstant.DELETED,
      });

      return modifiedCount;
    } catch (error) {
      throw LError(`[AdminRepository.softDeleteAdmin]: unable to delete admin: ${adminId}`, error);
    }
  }
}

export default AdminRepository;
