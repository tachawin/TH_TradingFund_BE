import banks from '../entities/constants/company_bank_th';
import { CustomerBodyRequest } from '../entities/dtos/customer.dtos';
import { Customer } from '../entities/schemas/customer.schema';

import { LError, SError } from './errors.handler';

const numberOnlyRegex = /^[0-9]*$/;
const PASSWORD_LENGTH_MINIMUM = 6;

function passwordValidate(password: string): [boolean, string] {
  const errorCode = 'ERR.CUSTOMER.PASSWORD.1';

  if (password.length < PASSWORD_LENGTH_MINIMUM) {
    LError(`[customer.validator.passwordValidate]: password length should be greater than ${PASSWORD_LENGTH_MINIMUM}`);

    return [false, errorCode];
  }

  return [true, errorCode];
}

function mobileValidate(mobileNumber: string): [boolean, string] {
  const isValid = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(mobileNumber);

  return [isValid, 'ERR.CUSTOMER.MOBILENUMBER.1'];
}

function bankAccountNumberValidate(bankAccountNumber: string): [boolean, string] {
  const isValid = numberOnlyRegex.test(bankAccountNumber);

  return [isValid, 'ERR.COMPANYBANK.ACCOUNTNUMBER.1'];
}

function bankNameValidate(name: string): [boolean, string] {
  const isValid = name.toLocaleLowerCase() in banks;

  return [isValid, 'ERR.CUSTOMER.BANKNAME.1'];
}

export function customerInfoValidate(customerInfo: Customer | CustomerBodyRequest): customerInfo is Customer {
  const {
    mobileNumber, password, bankAccountNumber, bankName,
  } = customerInfo;

  const [isMobileNumberFormat, mobileNumberErrorCode] = mobileValidate(mobileNumber);
  if (!isMobileNumberFormat) {
    throw SError(mobileNumberErrorCode);
  }

  const [isPasswordFormat, passwordErrorCode] = passwordValidate(password);
  if (!isPasswordFormat) {
    throw SError(passwordErrorCode);
  }

  const [isBankAccountNumberFormat, bankAccountNumberErrorCode] = bankAccountNumberValidate(bankAccountNumber);
  if (!isBankAccountNumberFormat) {
    throw SError(bankAccountNumberErrorCode);
  }

  const [isBankNameFormat, bankNameErrorCode] = bankNameValidate(bankName);
  if (!isBankNameFormat) {
    throw SError(bankNameErrorCode);
  }

  return isMobileNumberFormat && isPasswordFormat && isBankAccountNumberFormat && isBankNameFormat;
}

export function newPasswordValidate(password: string) {
  const [isPasswordFormat, passwordErrorCode] = passwordValidate(password);
  if (!isPasswordFormat) {
    throw SError(passwordErrorCode);
  }

  return isPasswordFormat;
}
