import App from './app';

import AdminAuthPlugin from './plugins/admin.auth.plugin';
import APIAuthPlugin from './plugins/api.auth.plugin';
import CommonAuthPlugin from './plugins/common.auth.plugin';
import CookiePlugin from './plugins/cookies.plugin';
import CORSPlugin from './plugins/cors.plugin';
import CustomerAuthPlugin from './plugins/customer.auth.plugin';
import MultipartPlugin from './plugins/multipart.plugin';
import PermissionPlugin from './plugins/permission.plugin';

import AdminAuthRoutes from './routes/admin.auth.route';
import AdminUserRoutes from './routes/admin.user.route';
import APIExternalServiceRoutes from './routes/api.route';
import BankRoutes from './routes/bank.route';
import CashbackRoutes from './routes/cashback.route';
import CompanyBankRoutes from './routes/company.bank.route';
import RedeemCreditRoutes from './routes/credit.redeem.route';
import CreditConditionRoutes from './routes/credit_condition.route';
import CustomerAdminRoutes from './routes/customer.admin.route';
import CustomerAuthRoutes from './routes/customer.auth.route';
import CustomerUserRoutes from './routes/customer.user.route';
import DepositTransactionRoutes from './routes/deposit.transaction.route';
import LevelRoutes from './routes/level.customer.route';
import RedeemProductRoutes from './routes/product.redeem.route';
import ProductRoutes from './routes/product.route';
import ReportTransactionRoutes from './routes/report.transaction';
import SettingRoutes from './routes/setting.route';
import WebhookTransactionRoutes from './routes/webhook.transaction.route';
import WithdrawTransactionRoutes from './routes/withdraw.transaction.route';

const app = new App({
  routes: [
    APIExternalServiceRoutes,
    SettingRoutes,

    AdminAuthRoutes,
    CustomerAuthRoutes,

    AdminUserRoutes,
    CustomerAdminRoutes,
    CustomerUserRoutes,

    LevelRoutes,

    BankRoutes,
    CompanyBankRoutes,

    CreditConditionRoutes,
    ProductRoutes,
    RedeemCreditRoutes,
    RedeemProductRoutes,

    WebhookTransactionRoutes,
    DepositTransactionRoutes,
    WithdrawTransactionRoutes,
    CashbackRoutes,
    ReportTransactionRoutes,
  ],
  plugins: [
    CookiePlugin,
    CORSPlugin,
    AdminAuthPlugin.AccessTokenAdminAuthPlugin,
    AdminAuthPlugin.RefreshTokenAdminAuthPlugin,
    CommonAuthPlugin.AccessTokenCommonAuthPlugin,
    CustomerAuthPlugin.AccessTokenCustomerAuthPlugin,
    CustomerAuthPlugin.RefreshTokenCustomerAuthPlugin,
    PermissionPlugin,
    APIAuthPlugin,
    MultipartPlugin,
  ],
});

app.listen();
