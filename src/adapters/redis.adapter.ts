import { createClient } from 'redis';

import config from '../config/config';

class RedisAdapter {
  static instance = null;

  private redisClient = null;
  private URL = '';

  private info = {
    protocol: config.db.redis.protocol,
    username: config.db.redis.username,
    password: config.db.redis.password,
    host: config.db.redis.host,
    port: config.db.redis.port,
    database: config.db.redis.database,
  };

  public key = {
    ADMIN: {
      VERIFY_OTP: 'admin_service:verify_otp_register:admin:{{ADMIN_ID}}:ref_code:{{REF_CODE}}',
      VERIFY_REFRESH_TOKEN: 'admin_service:verify_refresh_token:refresh_token:{{REFRESH_TOKEN}}',
      VERIFY_PERMISSION: 'admin_service:verify_permission:admin:{{ADMIN_ID}}',
    },
    CUSTOMER: {
      VERIFY_OTP: 'customer_service:verify_otp_register:mobile_number:{{MOBILE_NUMBER}}:ref_code:{{REF_CODE}}',
      VERIFY_REFRESH_TOKEN: 'customer_service:verify_refresh_token:refresh_token:{{REFRESH_TOKEN}}',
    },
    TRANSACTION: {
      VERIFY_DEPOSIT: 'transaction_service:verify_deposit:ref_code:{{REF_CODE}}',
      VERIFY_WITHDRAW: 'transaction_service:verify_withdraw:ref_code:{{REF_CODE}}',
    },
    SETTING: 'system:setting:{{USER_TYPE}}',
  };

  constructor() {
    this.URL = this.createURL();
    this.redisClient = createClient({
      url: this.URL,
    });

    this.connect();
    this.redisClient.on('error', this.error);
  }

  static getInstance(): InstanceType<typeof RedisAdapter> {
    if (!RedisAdapter.instance) RedisAdapter.instance = new RedisAdapter();

    return RedisAdapter.instance;
  }

  private createURL() {
    const {
      protocol, username, password, host, port,
    } = this.info;

    return `${protocol}://${username}:${password}@${host}:${port}`;
  }

  private async connect() {
    await this.redisClient.connect();

    console.info('[RedisAdapter.connected]: Redis has connected 🎉');
  }

  private error(error: Error) {
    console.error('[RedisAdapter.error]: ', error);

    throw error;
  }

  private disconnect() {
    this.redisClient.quit();

    console.info('[RedisAdapter.disconnect]: Redis has disconnected 👻');
  }

  public async set(key: string, value: string) {
    await this.redisClient.set(key, value);
  }

  public async setJSON(key: string, path: string, json: object) {
    await this.redisClient.json.set(key, path, json);
  }

  public async getJSON(key: string) {
    const cached = await this.redisClient.json.get(key);

    return cached;
  }

  public async setex(key: string, value: string, expiredAt: number) {
    await this.redisClient.SETEX(key, expiredAt, value);
  }

  public async del(key: string) {
    await this.redisClient.del(key);
  }

  public async get(key: string) {
    const cached = await this.redisClient.get(key);

    return cached;
  }

  public async exists(key: string): Promise<number> {
    const count = await this.redisClient.exists(key);

    return count;
  }

  public getKeyAdminSetting(userType: string) {
    return this.key.SETTING.replace('{{USER_TYPE}}', userType);
  }

  public getKeyAdminVerifyOTP(adminId: string, refCode: string): string {
    return this.key.ADMIN.VERIFY_OTP
      .replace('{{ADMIN_ID}}', adminId)
      .replace('{{REF_CODE}}', refCode);
  }

  public getKeyAdminRefreshToken(refreshToken: string): string {
    return this.key.ADMIN.VERIFY_REFRESH_TOKEN
      .replace('{{REFRESH_TOKEN}}', refreshToken);
  }

  public getKeyVerifyAdminPermission(adminId: string): string {
    return this.key.ADMIN.VERIFY_PERMISSION
      .replace('{{ADMIN_ID}}', adminId);
  }

  public getKeyCustomerVerifyOTP(mobileNumber: string, refCode: string): string {
    return this.key.CUSTOMER.VERIFY_OTP
      .replace('{{MOBILE_NUMBER}}', mobileNumber)
      .replace('{{REF_CODE}}', refCode);
  }

  public getKeyCustomerRefreshToken(refreshToken: string): string {
    return this.key.CUSTOMER.VERIFY_REFRESH_TOKEN
      .replace('{{REFRESH_TOKEN}}', refreshToken);
  }

  public getKeyTransactionVerifyDeposit(refCode: string): string {
    return this.key.TRANSACTION.VERIFY_DEPOSIT
      .replace('{{REF_CODE}}', refCode);
  }

  public getKeyTransactionVerifyWithdraw(refCode: string): string {
    return this.key.TRANSACTION.VERIFY_WITHDRAW
      .replace('{{REF_CODE}}', refCode);
  }
}

export default RedisAdapter;
