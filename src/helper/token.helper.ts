import jwt, { JwtPayload } from 'jsonwebtoken';

import config from '../config/config';

import {
  AdminAccessTokenPayload, AdminRefreshTokenPayload, APITokenPayload, CustomerAccessTokenPayload, CustomerRefreshTokenPayload,
} from '../entities/interfaces/data/token.interface';

export const generateRefreshTokenAdmin = (adminRefreshTokenPayload: AdminRefreshTokenPayload) => {
  const secret = config.jwt.admin.refresh_token.secret.jwt_secret;

  const claims = {
    expiresIn: config.jwt.admin.refresh_token.options.expires_in,
    issuer: config.jwt.admin.refresh_token.options.issuer,
    audience: config.jwt.admin.refresh_token.options.audience,
  };

  const payload = {
    ...adminRefreshTokenPayload,
  };

  const token = jwt.sign(payload, secret, claims);

  return token;
};

export const generateAccessTokenAdmin = (adminAccessTokenPayload: AdminAccessTokenPayload) => {
  const secret = config.jwt.admin.access_token.secret.jwt_secret;

  const claims = {
    expiresIn: config.jwt.admin.access_token.options.expires_in,
    issuer: config.jwt.admin.access_token.options.issuer,
    audience: config.jwt.admin.access_token.options.audience,
  };

  const payload = {
    ...adminAccessTokenPayload,
  };

  const token = jwt.sign(payload, secret, claims);

  return token;
};

export const verifyAndDecodeAdminRefreshToken = (refreshToken: string): JwtPayload => {
  const secret = config.jwt.admin.refresh_token.secret.jwt_secret;
  const decoded = jwt.verify(refreshToken, secret);

  if (typeof decoded === 'string' || decoded instanceof String) {
    return {};
  }

  return decoded;
};

export const generateRefreshTokenCustomer = (customerRefreshTokenPayload: CustomerRefreshTokenPayload) => {
  const secret = config.jwt.customer.refresh_token.secret.jwt_secret;

  const claims = {
    expiresIn: config.jwt.customer.refresh_token.options.expires_in,
    issuer: config.jwt.customer.refresh_token.options.issuer,
    audience: config.jwt.customer.refresh_token.options.audience,
  };

  const payload = {
    ...customerRefreshTokenPayload,
  };

  const token = jwt.sign(payload, secret, claims);

  return token;
};

export const generateAccessTokenCustomer = (customerAccessTokenPayload: CustomerAccessTokenPayload) => {
  const secret = config.jwt.customer.access_token.secret.jwt_secret;

  const claims = {
    expiresIn: config.jwt.customer.access_token.options.expires_in,
    issuer: config.jwt.customer.access_token.options.issuer,
    audience: config.jwt.customer.access_token.options.audience,
  };

  const payload = {
    ...customerAccessTokenPayload,
  };

  const token = jwt.sign(payload, secret, claims);

  return token;
};

export const verifyAndDecodeCustomerRefreshToken = (refreshToken: string): JwtPayload => {
  const secret = config.jwt.customer.refresh_token.secret.jwt_secret;
  const decoded = jwt.verify(refreshToken, secret);

  if (typeof decoded === 'string' || decoded instanceof String) {
    return {};
  }

  return decoded;
};

export const generateAPIToken = (apiTokenPayload: APITokenPayload) => {
  const secret = config.jwt.api.api_token.secret.jwt_secret;

  const claims = {
    expiresIn: config.jwt.api.api_token.options.expires_in,
    issuer: config.jwt.api.api_token.options.issuer,
    audience: config.jwt.api.api_token.options.audience,
  };

  const payload = {
    ...apiTokenPayload,
  };

  const token = jwt.sign(payload, secret, claims);

  return token;
};
