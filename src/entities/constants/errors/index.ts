import ADMIN_STANDARD_ERROR from './admin.errors';
import COMPANY_BANK_STANDARD_ERROR from './company_bank.errors';
import CUSTOMER_STANDARD_ERROR from './customer.errors';
import CUSTOMER_LEVEL_STANDARD_ERROR from './customer_level.errors';

export const STANDARD_ERROR = {
  ...ADMIN_STANDARD_ERROR,
  ...COMPANY_BANK_STANDARD_ERROR,
  ...CUSTOMER_STANDARD_ERROR,
  ...CUSTOMER_LEVEL_STANDARD_ERROR,
  '': {
    code: 500,
    message: 'something went wrong, please contact to super admin',
  },
};
