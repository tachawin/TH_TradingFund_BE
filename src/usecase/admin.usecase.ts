import RedisAdapter from '../adapters/redis.adapter';

import { ACTION } from '../entities/constants/action';
import { AdminListFilterDTO, UpdateAdminDTO } from '../entities/dtos/admin.dtos';
import {
  Admin,
  AdminResponse,
  AdminSaveResponse,
} from '../entities/schemas/admin.schema';
import {
  FeatureAccessLevel,
  PermissionFeatureResponse,
} from '../entities/schemas/features.schema';

import { LError } from '../helper/errors.handler';
import { hashing } from '../helper/hash.handler';

import AdminRepository from '../repositories/admin.repository';

const redisClient = RedisAdapter.getInstance();

const adminRepo = AdminRepository.getInstance();

async function findAdminList(filters: AdminListFilterDTO): Promise<Admin[]> {
  try {
    const admins = await adminRepo.findAllAdmin(filters);

    return admins;
  } catch (error) {
    throw LError('[usecase.findAdminList]: unable to find all admin', error);
  }
}

async function createAdmin(adminInfo: Admin): AdminSaveResponse {
  try {
    const newAdmin = await adminRepo.createAdmin(adminInfo);

    delete newAdmin.password;

    return newAdmin;
  } catch (error) {
    throw LError('[usecase.createAdmin]: unable to create admin', error);
  }
}

async function updateAdmin(adminId: string, newAdminInfo: UpdateAdminDTO): AdminResponse {
  try {
    const newAdmin = await adminRepo.updateAdmin(adminId, newAdminInfo);

    if ('status' in newAdminInfo || 'role' in newAdminInfo) {
      const { status, role, features } = newAdmin;

      const keyVerifyAdminPermission = redisClient.getKeyVerifyAdminPermission(adminId);
      await redisClient.setJSON(keyVerifyAdminPermission, '.', { status, role, features });
    }

    return newAdmin;
  } catch (error) {
    throw LError('[usecase.updateAdmin]: unable to update admin information', error);
  }
}

async function updateAdminPermission(adminId: string, newPermission: FeatureAccessLevel): PermissionFeatureResponse {
  try {
    const { status, role, features } = await adminRepo.updatePermissionAdmin(adminId, newPermission);

    const keyVerifyAdminPermission = redisClient.getKeyVerifyAdminPermission(adminId);
    await redisClient.setJSON(keyVerifyAdminPermission, '.', { status, role, features });

    return features;
  } catch (error) {
    throw LError('[usecase.updateAdminPermission]: unable to update admin permission', error);
  }
}

async function changeAdminPassword(adminId: string, newPassword: string): Promise<void> {
  try {
    const passwordHashed = hashing(newPassword);

    await adminRepo.updateAdmin(adminId, { password: passwordHashed });
  } catch (error) {
    throw LError('[usecase.changeAdminPassword]: unable to change admin password', error);
  }
}

async function deleteAdmin(adminId: string, action: string): Promise<boolean> {
  try {
    if (action === ACTION.DELETE.HARD) {
      const deletedCount = await adminRepo.hardDeleteAdmin(adminId);
      if (deletedCount === 0) {
        return false;
      }

      return true;
    }

    const updatedCount = await adminRepo.softDeleteAdmin(adminId);
    if (updatedCount === 0) {
      return false;
    }

    const keyVerifyAdminPermission = redisClient.getKeyVerifyAdminPermission(adminId);
    await redisClient.del(keyVerifyAdminPermission);

    return true;
  } catch (error) {
    throw LError('[usecase.deleteAdmin]: unable to delete admin', error);
  }
}

export default {
  findAdminList,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  updateAdminPermission,
  changeAdminPassword,
};
