import config from '../config/config';

export const expireInDays = (days: number) => {
  const now = new Date();
  const shiftDate = new Date(now);

  shiftDate.setDate(now.getDate() + days);

  return shiftDate;
};

export const cookieOptionsAdminRefreshToken = {
  ...config.cookie.admin.refresh_token.options,
  expires: expireInDays(config.cookie.admin.refresh_token.options.expires),
};

export const cookieOptionsCustomerRefreshToken = {
  ...config.cookie.customer.refresh_token.options,
  expires: expireInDays(config.cookie.customer.refresh_token.options.expires),
};
