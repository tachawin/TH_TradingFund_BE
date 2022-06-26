export const TRANSACTION_STATUS_ACTION = {
  START: 'starting_action',
  WALLET: {
    WITHDRAW: 'wallet_withdraw_action_done',
    DEPOSIT: 'wallet_deposit_action_done',
  },
  BANK: {
    WITHDRAW: 'bank_withdraw_action_done',
    DEPOSIT: 'bank_deposit_action_done',
  },
  CUSTOMER: {
    UPDATE: {
      CREDIT: 'customer_update_credit_action_done',
      LAST_DEPOSIT: 'customer_update_last_deposit_action_done',
    },
  },
  COMPANY: {
    UPDATE: {
      BALANCE: 'company_update_balance_action_done',
    },
  },
  TRANSACTION: {
    CREATED: 'transaction_create_action_done',
  },
};
