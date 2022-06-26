import { isValidObjectId } from 'mongoose';
import WalletClientAdapter from '../adapters/wallet.client.adapter';

import CompanyBankTH from '../entities/constants/company_bank_th';
import { CustomerListFilterDTO, DashboardAmountCustomerByDay, CustomerAddressBodyRequest } from '../entities/dtos/customer.dtos';
import {
  Customer,
  CustomerMobileNumberResponse,
  CustomerSaveResponse,
  CustomerWithLevelResponse,
  CustomerListResponse,
} from '../entities/schemas/customer.schema';

import { toBankFullName } from '../helper/bank.handler';
import { LError } from '../helper/errors.handler';
import { findLevel } from '../helper/level.helper';
import { timeFilterToDateTHTimeZoneFloor } from '../helper/time.handler';

import CustomerRepository from '../repositories/customer.repository';
import CustomerLevelRepository from '../repositories/customer_level.repository';
import TransactionRepository from '../repositories/transaction.repository';

const walletClient = WalletClientAdapter.getInstance();

const customer = CustomerRepository.getInstance();
const customerLevel = CustomerLevelRepository.getInstance();
const transaction = TransactionRepository.getInstance();

async function createCustomer(customerInfo: Customer): CustomerSaveResponse {
  try {
    const saveCustomer = { ...customerInfo };
    const { bankName } = customerInfo;

    if (bankName) {
      saveCustomer.bankName = toBankFullName(bankName);
    }

    const newCustomer = await customer.createCustomer(saveCustomer);
    await walletClient.createWallet(saveCustomer.mobileNumber);

    delete newCustomer.password;

    return { ...newCustomer, credit: 0 };
  } catch (error) {
    throw LError('[usecase.createCustomer]: unable to create customer', error);
  }
}

async function findCustomerList(filters: CustomerListFilterDTO): CustomerListResponse {
  try {
    const customers = await customer.findAllCustomer(filters) as any;
    const levelResults = await customerLevel.findAllLevel();

    const levels = {};
    const minimumDepositList = [];
    levelResults.forEach((levelInfo) => {
      const {
        levelName, imageURL, minimumDepositAmount, maximumDepositAmount, investmentAmount, cashback,
      } = levelInfo;
      levels[minimumDepositAmount] = {
        levelName, imageURL, maximumDepositAmount, investmentAmount, cashback,
      };
      minimumDepositList.push(minimumDepositAmount);
    });
    minimumDepositList.sort((a, b) => a - b);

    const promises = customers.map(async ({ _doc: customer }) => {
      const { mobileNumber, bankName, totalDepositAmount } = customer;

      const bankAcronym = bankName.split(' ')[0];
      const bank = { ...CompanyBankTH[bankAcronym], acronym: bankAcronym };

      let levelMinimumDeposit = 0;
      minimumDepositList.some((minimumDeposit) => {
        const isTotalDepositInRange = (totalDepositAmount <= levels[minimumDeposit].maximumDepositAmount && totalDepositAmount >= minimumDeposit);
        // && with investmant amount after get API
        if (isTotalDepositInRange) {
          levelMinimumDeposit = minimumDeposit;
          return true;
        }
        return false;
      });
      const level = { ...levels[levelMinimumDeposit] };

      try {
        const { balance } = await walletClient.balance(mobileNumber);

        if (balance) {
          return {
            ...customer, credit: balance, bank, level,
          };
        }

        return {
          ...customer, credit: 0, bank, level,
        };
      } catch (error) {
        LError(`[usecase.findCustomerList]: unable to get customer balance wallet, mobileNumber:${mobileNumber}`, error);

        return {
          ...customer, credit: 0, bank, level,
        };
      }
    });

    const result = await Promise.all(promises);

    return result;
  } catch (error) {
    throw LError('[usecase.findCustomerList]: unable to find all customer', error);
  }
}

async function findCustomerByCustomerID(customerId: string): Promise<CustomerWithLevelResponse> {
  try {
    const selectedCustomer = await customer.findCustomerByCustomerID(customerId);
    const { bankName, mobileNumber, totalDepositAmount } = selectedCustomer;

    const levelResults = await customerLevel.findAllLevel();

    const level = findLevel(levelResults, totalDepositAmount);

    const bankAcronym = bankName.split(' ')[0];
    const bank = { ...CompanyBankTH[bankAcronym], acronym: bankAcronym };
    delete bank.id;

    delete selectedCustomer.password;
    delete selectedCustomer.bankName;

    const { balance } = await walletClient.balance(mobileNumber);

    return {
      ...selectedCustomer, credit: balance || 0, bank, level,
    };
  } catch (error) {
    throw LError(`[usecase.findCustomerByCustomerID]: unable to find customer with id: ${customerId}`, error);
  }
}

async function findCustomerMobileNumberList(): Promise<CustomerMobileNumberResponse> {
  try {
    const list = await customer.findAllCustomerMobileNumber();

    return list;
  } catch (error) {
    throw LError('[usecase.findCustomerByCustomerID]: unable to find customer', error);
  }
}

async function getAmountCustomerRegisterByDay(dateStart: string, dateEnd: string): Promise<DashboardAmountCustomerByDay> {
  try {
    const start = timeFilterToDateTHTimeZoneFloor(dateStart);
    const end = timeFilterToDateTHTimeZoneFloor(dateEnd);

    console.log(dateStart, start);
    console.log(dateEnd, end);

    const result: DashboardAmountCustomerByDay = {};

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      // eslint-disable-next-line no-await-in-loop
      const customers = await customer.findCustomerRegisterByDay(date);

      let count = 0;
      const promises = customers.map(async ({ mobileNumber }) => {
        try {
          const action = await transaction.findTransactionByCustomerMobileNumberAndDate(mobileNumber, date);

          if (action) {
            count += 1;
          }
        } catch (error) {
          LError('', error);
        }
      });

      // eslint-disable-next-line no-await-in-loop
      await Promise.all(promises);

      result[date] = {
        totalRegister: customers.length,
        totalRegisterAndAction: count,
      };
    }

    return result;
  } catch (error) {
    throw LError('[usecase.getAmountCustomerRegisterByDay]: unable to get customer register and action per day', error);
  }
}

async function validateRefCode(refCode: string): Promise<boolean> {
  const isValid = isValidObjectId(refCode) && await customer.isCustomerExists(refCode);
  if (!isValid) {
    throw LError(`[CustomerUsecase.validateRefCode]: ref code: ${refCode} is invalid`);
  }
  return isValid;
}

async function addCustomerAddress(customerId: string, newCustomerAddress: CustomerAddressBodyRequest) {
  try {
    const result = await customer.addCustomerAddress(customerId, newCustomerAddress);
    return result;
  } catch (errpr) {
    throw LError('[CustomerUsecase.addCustomerAddress]: unable to add new customer address', errpr);
  }
}

async function deleteCustomerAddress(customerId: string, addressId: string) {
  try {
    const result = await customer.deleteCustomerAddress(customerId, addressId);
    return result;
  } catch (errpr) {
    throw LError('[CustomerUsecase.updateCustomerAddress]: unable to delete customer address', errpr);
  }
}

async function updateCustomerPresentAddress(customerId: string, addressId: string) {
  try {
    const result = await customer.updateCustomerPresentAddress(customerId, addressId);
    return result;
  } catch (errpr) {
    throw LError('[CustomerUsecase.updateCustomerPresentAddress]: unable to update customer present address', errpr);
  }
}

export default {
  createCustomer,
  findCustomerList,
  findCustomerByCustomerID,
  findCustomerMobileNumberList,
  getAmountCustomerRegisterByDay,
  validateRefCode,
  addCustomerAddress,
  deleteCustomerAddress,
  updateCustomerPresentAddress,
};
