/* eslint-disable no-use-before-define */

import { model, Model, FilterQuery } from 'mongoose';
import config from '../config/config';
import {
  CustomerListFilter, CustomerListFilterDTO, UpdateCustomerDTO, CustomerAddressBodyRequest,
} from '../entities/dtos/customer.dtos';

import {
  Customer,
  CustomerDocument,
  CustomerSchema,
  CustomerResponse,
  CUSTOMER_STATUS,
  CustomerListResponse,
  CustomerMobileNumberResponse,
} from '../entities/schemas/customer.schema';

import { LError } from '../helper/errors.handler';
import {
  timeFilterToDateTHTimeZoneCeil,
  timeFilterToDateTHTimeZoneFloor,
} from '../helper/time.handler';

class CustomerRepository {
  private static instance: CustomerRepository;
  private _model: Model<CustomerDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.customer;
    this._model = model<CustomerDocument>(this.collection, CustomerSchema);
  }

  public static getInstance(): CustomerRepository {
    if (!CustomerRepository.instance) {
      CustomerRepository.instance = new CustomerRepository();
    }

    return CustomerRepository.instance;
  }

  public async createCustomer(customer: Customer): CustomerResponse {
    const mongooseModel = new this._model(customer);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[CustomerRepository.createCustomer]: unable to save customer to database', error);
    }
  }

  public async findAllCustomerActive(): CustomerListResponse {
    try {
      const result = await this._model.find({ status: CUSTOMER_STATUS.ACTIVE }, { _id: 0, password: 0 }).sort({ createdAt: -1 });

      return result;
    } catch (error) {
      throw LError('[CustomerRepository.findAllCustomerActive]: unable to find all active customer on database ', error);
    }
  }

  public async findAllCustomer(listFilters: CustomerListFilterDTO): CustomerListResponse {
    let query: FilterQuery<CustomerDocument> = {};

    try {
      const {
        bank, startCreated, endCreated, startLastLogin, endLastLogin, keyword, sortField, sortDirection,
      } = listFilters;

      const filters: CustomerListFilter = {};

      let search = [];

      if (bank?.length > 0 && typeof bank !== 'string') {
        filters.bankName = {
          $in: bank,
        };
      }

      const createdFilter: FilterQuery<CustomerDocument> = {};
      if (startCreated) {
        createdFilter.$gte = timeFilterToDateTHTimeZoneFloor(startCreated);
      }

      if (endCreated) {
        createdFilter.$lte = timeFilterToDateTHTimeZoneCeil(endCreated);
      }

      const lastLoginFilter: FilterQuery<CustomerDocument> = {};
      if (startLastLogin) {
        lastLoginFilter.$gte = timeFilterToDateTHTimeZoneFloor(startLastLogin);
      }

      if (endLastLogin) {
        lastLoginFilter.$lte = timeFilterToDateTHTimeZoneCeil(endLastLogin);
      }

      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        search = [
          { mobileNumber: regex },
          { name: regex },
          { bankAccountName: regex },
          { bankAccountNumber: regex },
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

      const isUpdatedFilterTimeRange = Object.keys(lastLoginFilter).length !== 0;
      if (isUpdatedFilterTimeRange) {
        multiFilter.push({ lastLoginAt: lastLoginFilter });
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
        query = { updatedAt: lastLoginFilter };
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

      console.info(query, sortOptions);

      const result = await this._model.find(query, { _id: 0, password: 0 }).sort(sortOptions);

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.findAllCustomer]: unable to find all customer on database with query:${query}`, error);
    }
  }

  public async findCustomerByCustomerID(customerId: string): CustomerResponse {
    try {
      const query = {
        customerId,
        status: CUSTOMER_STATUS.ACTIVE,
      };
      const result = await this._model.findOne(query, { _id: 0 }) as any;

      if (result) {
        return result._doc;
      }

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.findCustomerByCustomerID]: unable to find customer with the customer_id: ${customerId}`, error);
    }
  }

  public async isCustomerExists(customerId: string): Promise<boolean> {
    try {
      const query = {
        customerId,
        status: CUSTOMER_STATUS.ACTIVE,
      };
      const result = await this._model.findOne(query, { _id: 0 });
      if (result) {
        return true;
      }
      return false;
    } catch (error) {
      throw LError('[CustomerRepository.isCustomerExists]: unable to find customer from database', error);
    }
  }

  public async findCustomerByMobileNumber(mobileNumber: string): CustomerResponse {
    try {
      const query = {
        mobileNumber,
        status: CUSTOMER_STATUS.ACTIVE,
      };

      const result = await this._model.findOne(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.findCustomerByMobileNumber]: unable to find customer with the mobile number: ${mobileNumber}`, error);
    }
  }

  public async findCustomerByAccountNumber(bankAccountNumber: string): CustomerListResponse {
    try {
      const query = {
        bankAccountNumber,
        status: CUSTOMER_STATUS.ACTIVE,
      };

      const result = await this._model.find(query, { _id: 0 });

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.findCustomerByAccountNumber]: unable to find customers with thebankAccountNumber: ${bankAccountNumber}`, error);
    }
  }

  public async findAllCustomerMobileNumber(): Promise<CustomerMobileNumberResponse> {
    try {
      const query = {
        status: CUSTOMER_STATUS.ACTIVE,
      };

      const result = await this._model.find(query, { _id: 0, mobileNumber: 1 }).distinct('mobileNumber') as any;

      return result;
    } catch (error) {
      throw LError('[CustomerRepository.findCustomerByMobileNumber]: unable to find all customer mobile number', error);
    }
  }

  public async updateCustomer(customerId: string, newCustomerInfo: UpdateCustomerDTO): CustomerResponse {
    try {
      const query = {
        customerId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        newCustomerInfo,
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.updateCustomer]: unable to update: ${customerId}`, error);
    }
  }

  public async updateCustomerPassword(customerId: string, newPassword: string): Promise<number> {
    try {
      const query = {
        customerId,
      };

      const { modifiedCount } = await this._model.updateOne(query, {
        password: newPassword,
      });

      return modifiedCount;
    } catch (error) {
      throw LError(`[CustomerRepository.updateCustomerPassword]: unable to update password: ${customerId}`, error);
    }
  }

  public async markLastDepositAmountAndUpdateTotalDepositAmount(mobileNumber: string, amount: number): CustomerResponse {
    try {
      const query = {
        mobileNumber,
      };

      const result = await this._model.findOneAndUpdate(query, {
        $set: {
          lastDepositAmount: amount,
        },
        $inc: {
          totalDepositAmount: amount,
        },
      });

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.markLastDepositAmount]: unable to mark last deposit amount by mobileNumber:${mobileNumber}, amount:${amount}`, error);
    }
  }

  public async updateCreditBalance(mobileNumber: string, currentBalance: number): CustomerResponse {
    try {
      const query = {
        mobileNumber,
      };

      const result = await this._model.findOneAndUpdate(query, {
        credit: currentBalance,
      });

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.updateCreditBalance]: unable to update credit by mobileNumber:${mobileNumber}, currentBalance:${currentBalance}`, error);
    }
  }

  public async increaseCreditCustomer(mobileNumber: string, amount: number): CustomerResponse {
    try {
      const query = {
        mobileNumber,
      };

      const result = await this._model.findOneAndUpdate(query, {
        $inc: { credit: amount },
      });

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.increaseCreditCustomer]: unable to increase credit by mobileNumber:${mobileNumber}, amount:${amount}`, error);
    }
  }

  public async decreaseCreditCustomer(mobileNumber: string, amount: number): CustomerResponse {
    try {
      const query = {
        mobileNumber,
      };

      if (amount < 0) {
        throw LError('[CustomerRepository.decreaseCreditCustomer]: unable to decrease credit with minus value');
      }

      const result = await this._model.findOneAndUpdate(query, {
        $inc: { credit: amount * -1 },
      });

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.decreaseCreditCustomer]: unable to decrease credit by mobileNumber:${mobileNumber}, amount:${amount}`, error);
    }
  }

  public async increasePointCustomer(mobileNumber: string, amount: number): CustomerResponse {
    try {
      const query = {
        mobileNumber,
      };

      const result = await this._model.findOneAndUpdate(query, {
        $inc: { point: amount },
      });

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.increasePointCustomer]: unable to increase point by mobileNumber:${mobileNumber}, amount:${amount}`, error);
    }
  }

  public async decreasePointCustomer(mobileNumber: string, amount: number): CustomerResponse {
    try {
      const query = {
        mobileNumber,
      };

      if (amount < 0) {
        throw LError('[CustomerRepository.decreasePointCustomer]: unable to decrease point with minus value');
      }

      const result = await this._model.findOneAndUpdate(query, {
        $inc: { point: amount * -1 },
      });

      return result;
    } catch (error) {
      throw LError(`[CustomerRepository.decreasePointCustomer]: unable to decrease point by mobileNumber:${mobileNumber}, amount:${amount}`, error);
    }
  }

  public async findCustomerRegisterByDay(date: string): CustomerListResponse {
    try {
      const gte = timeFilterToDateTHTimeZoneFloor(date);
      const lte = timeFilterToDateTHTimeZoneCeil(date);

      const result = this._model.find({
        createdAt: {
          $gte: gte,
          $lte: lte,
        },
      });

      return result;
    } catch (error) {
      throw LError('[CustomerRepository.findCustomerRegisterByDay]: unable to get customer register per day', error);
    }
  }

  public async addCustomerAddress(customerId: string, newCustomerAddress: CustomerAddressBodyRequest): CustomerResponse {
    try {
      const query = {
        customerId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        { $push: { address: newCustomerAddress } },
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );
      return result;
    } catch (error) {
      throw LError('[CustomerRepository.addCustomerAddress]: unable to add new customer address', error);
    }
  }

  public async deleteCustomerAddress(customerId: string, addressId: string): CustomerResponse {
    try {
      const query = {
        customerId,
      };

      const result = await this._model.findOneAndUpdate(
        query,
        { $pull: { address: { addressId } } },
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );
      return result;
    } catch (error) {
      throw LError('[CustomerRepository.updateCustomerAddress]: unable to delete customer address', error);
    }
  }

  public async updateCustomerPresentAddress(customerId: string, addressId: string): CustomerResponse {
    try {
      const query = {
        customerId,
      };

      const data = await this._model.findOne(query, 'address').lean();
      const updatedAddress = data.address.map((address) => ({ ...address, isPresentAddress: address.addressId.toString() === addressId }));
      const result = await this._model.findOneAndUpdate(
        query,
        { address: updatedAddress },
        {
          new: true,
          fields: { _id: 0, password: 0 },
        },
      );
      return result;
    } catch (error) {
      throw LError('[CustomerRepository.updateCustomerPresentAddress]: unable to update customer present address', error);
    }
  }
}

export default CustomerRepository;
