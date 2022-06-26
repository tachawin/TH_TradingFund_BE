import banks from '../entities/constants/company_bank_th';
import { CompanyBankBodyRequest } from '../entities/dtos/company_bank.dtos';
import { CompanyBank, COMPANY_BANK_STATUS, COMPANY_BANK_TYPE } from '../entities/schemas/company_bank.schema';

import { SError } from './errors.handler';

const numberOnlyRegex = /^[0-9]*$/;
const BANK_ACCOUNT_NAME_LENGTH_MAXIMUM = 120;

function statusValidate(status: string): [boolean, string] {
  const isValid = status.toLocaleUpperCase() in COMPANY_BANK_STATUS;

  return [isValid, 'ERR.COMPANYBANK.STATUS.1'];
}

function typeValidate(type: string): [boolean, string] {
  const isValid = type.toLocaleUpperCase() in COMPANY_BANK_TYPE;

  return [isValid, 'ERR.COMPANYBANK.TYPE.1'];
}

function bankAccountNameValidate(name: string): [boolean, string] {
  const isValid = name.length < BANK_ACCOUNT_NAME_LENGTH_MAXIMUM;

  return [isValid, 'ERR.COMPANYBANK.ACCOUNTNAME.1'];
}

function bankAccountNumberValidate(bankAccountNumber: string): [boolean, string] {
  const isValid = numberOnlyRegex.test(bankAccountNumber);

  return [isValid, 'ERR.COMPANYBANK.ACCOUNTNUMBER.1'];
}

function bankNameValidate(name: string): [boolean, string] {
  const isValid = name.toLocaleLowerCase() in banks;

  return [isValid, 'ERR.COMPANYBANK.NAME.1'];
}

function balanceValidate(balance: number): [boolean, string] {
  const isValid = balance >= 0;

  return [isValid, 'ERR.COMPANYBANK.BALANCE.1'];
}

const FIELDS_UPDATE_VALIDATOR = {
  bankAccountName: bankAccountNameValidate,
  bankAccountNumber: bankAccountNumberValidate,
  bankName: bankNameValidate,
  balance: balanceValidate,
  type: typeValidate,
  status: statusValidate,
};

export function companyBankInfoValidate(companyBankInfo: CompanyBank | CompanyBankBodyRequest): companyBankInfo is CompanyBank {
  const {
    bankAccountNumber, bankName, type, status,
  } = companyBankInfo;

  const [isBankAccountNumberFormat, bankAccountNumberErrorCode] = bankAccountNumberValidate(bankAccountNumber);
  if (!isBankAccountNumberFormat) {
    throw SError(bankAccountNumberErrorCode);
  }

  const [isBankNameFormat, bankNameErrorCode] = bankNameValidate(bankName);
  if (!isBankNameFormat) {
    throw SError(bankNameErrorCode);
  }

  const [isTypeFormat, typeErrorCode] = typeValidate(type);
  if (!isTypeFormat) {
    throw SError(typeErrorCode);
  }

  const [isStatusFormat, statusErrorCode] = statusValidate(status);
  if (!isStatusFormat) {
    throw SError(statusErrorCode);
  }

  return isBankAccountNumberFormat && isBankNameFormat && isTypeFormat && isStatusFormat;
}

export function companyBankInformationUpdateValidate(infoChange: any) {
  Object.keys(infoChange).forEach((field) => {
    if (!(field in FIELDS_UPDATE_VALIDATOR)) {
      throw SError('ERR.COMPANYBANK.UPDATE.WHITELIST.FIELD');
    }

    const validator = FIELDS_UPDATE_VALIDATOR[field];
    const [isValid, errorCode] = validator(infoChange[field]);
    if (!isValid) {
      throw SError(errorCode);
    }
  });
}
