import CompanyBankTH from '../entities/constants/company_bank_th';
import { CompanyBankTHType } from '../entities/interfaces/data/company_bank.interface';

function companyList(): CompanyBankTHType {
  return CompanyBankTH;
}

export default {
  companyList,
};
