import { AdminBodyRequest } from '../entities/dtos/admin.dtos';
import { Admin, AdminRoleConstant, AdminStatusConstant } from '../entities/schemas/admin.schema';
import { FeatureAccessLevel } from '../entities/schemas/features.schema';

import { LError, SError } from './errors.handler';

const noSpaceRegex = /^\S*$/;
const PASSWORD_LENGTH_MINIMUM = 6;
const NAME_LENGTH_MAXIMUM = 120;

const WHITELIST_FEATURES_PERMISSION = {
  report: '0000',
  customer: '0000',
  deposit: '0000',
  withdraw: '0000',
  bank: '0000',
  reward: '0000',
  credit: '0000',
  creditCondition: '0000',
  chat: '0000',
  product: '0000',
  adminManage: '0000',
  level: '0000',
  systemSetting: '0000',
  cashback: '0000',
};

function statusValidate(status: string): [boolean, string] {
  const isValid = status.toLocaleUpperCase() in AdminStatusConstant;

  return [isValid, 'ERR.ADMIN.STATUS.1'];
}

function roleValidate(role: string): [boolean, string] {
  const isValid = role.toLocaleUpperCase() in AdminRoleConstant;

  return [isValid, 'ERR.ADMIN.ROLE.1'];
}

function usernameValidate(username: string): [boolean, string] {
  const isValid = noSpaceRegex.test(username);

  return [isValid, 'ERR.ADMIN.USERNAME.1'];
}

function nameValidate(name: string): [boolean, string] {
  const isValid = name.length < NAME_LENGTH_MAXIMUM;

  return [isValid, 'ERR.ADMIN.NAME.1'];
}

function mobileValidate(mobileNumber: string): [boolean, string] {
  const isValid = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(mobileNumber);

  return [isValid, 'ERR.ADMIN.MOBILENUMBER.1'];
}

export function permissionValidate(permissions: FeatureAccessLevel): [boolean, string] {
  Object.keys(permissions).forEach((feature) => {
    if (!(feature in WHITELIST_FEATURES_PERMISSION)) {
      throw SError('ERR.ADMIN.UPDATE.WHITELIST.PERMISSION_FEATURES');
    }

    if (permissions[feature].length !== 4) {
      throw SError('ERR.ADMIN.FEATURES.1');
    }

    if (permissions[feature][0] < 0 || permissions[feature][0] > 1) {
      throw SError('ERR.ADMIN.FEATURES.1');
    }

    if (permissions[feature][1] < 0 || permissions[feature][1] > 1) {
      throw SError('ERR.ADMIN.FEATURES.1');
    }

    if (permissions[feature][2] < 0 || permissions[feature][2] > 1) {
      throw SError('ERR.ADMIN.FEATURES.1');
    }

    if (permissions[feature][3] < 0 || permissions[feature][3] > 1) {
      throw SError('ERR.ADMIN.FEATURES.1');
    }
  });

  return [true, ''];
}

export function passwordValidate(password: string): [boolean, string] {
  const errorCode = 'ERR.ADMIN.PASSWORD.1';

  if (password.length < PASSWORD_LENGTH_MINIMUM) {
    LError(`[admin.validator.passwordValidate]: password length should be grater than ${PASSWORD_LENGTH_MINIMUM}`);

    return [false, errorCode];
  }

  return [true, errorCode];
}

const FIELDS_UPDATE_VALIDATOR = {
  status: statusValidate,
  role: roleValidate,
  name: nameValidate,
  mobileNumber: mobileValidate,
  password: passwordValidate,
};

export function adminInfoValidate(adminInfo: Admin | AdminBodyRequest): adminInfo is Admin {
  const { username, password } = adminInfo;

  const [isUsernameFormat, usernameErrorCode] = usernameValidate(username);
  if (!isUsernameFormat) {
    throw SError(usernameErrorCode);
  }

  const [isPasswordFormat, passwordErrorCode] = passwordValidate(password);
  if (!isPasswordFormat) {
    throw SError(passwordErrorCode);
  }

  return isUsernameFormat && isPasswordFormat;
}

export function adminInformationUpdateValidate(infoChange: any) {
  Object.keys(infoChange).forEach((field) => {
    if (!(field in FIELDS_UPDATE_VALIDATOR)) {
      throw SError('ERR.ADMIN.UPDATE.WHITELIST.FIELD');
    }

    const validator = FIELDS_UPDATE_VALIDATOR[field];
    const [isValid, errorCode] = validator(infoChange[field]);
    if (!isValid) {
      throw SError(errorCode);
    }
  });
}
