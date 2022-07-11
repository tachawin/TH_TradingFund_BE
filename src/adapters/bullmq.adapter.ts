/* eslint-disable no-continue */
/* eslint-disable no-undef */
/* eslint-disable no-return-await */
/* eslint-disable import/no-named-as-default */

import {
  Queue, QueueScheduler, Worker, Job, QueueEvents,
} from 'bullmq';
import IORedis from 'ioredis';

import config from '../config/config';

import { DepositRequest, WithdrawRequest, WithdrawAndWaiveRequest } from '../entities/dtos/wallet.dtos';
import { Customer } from '../entities/schemas/customer.schema';

import { LError } from '../helper/errors.handler';
import { toDateTHTimeZoneByDate } from '../helper/time.handler';
import { generateHashCashback, generateHashTransaction } from '../helper/wallet.helper';

import CashbackHistoryRepository from '../repositories/cashback.history.repository';
import CustomerRepository from '../repositories/customer.repository';
import JobEventsRepository from '../repositories/job.events.repository';

import { WalletProcessor } from '../workers/wallet.worker';
import WalletClientAdapter from './wallet.client.adapter';

const walletClient = WalletClientAdapter.getInstance();

const customerRepo = CustomerRepository.getInstance();

const jobEventFailedRepo = JobEventsRepository.getInstance();
const cashbackRepo = CashbackHistoryRepository.getInstance();

interface JobPayload {
  jobId: string
  failedReason?: string
  returnvalue?: any
  data?: any
}

class BullMQAdapter {
  static instance = null;

  private connection_queue = null;
  private connection_cron = null;

  private URL = '';

  private info = {
    protocol: config.db.redis.protocol,
    username: config.db.redis.username,
    password: config.db.redis.password,
    host: config.db.redis.host,
    port: config.db.redis.port,
    database: config.db.redis.database,
  };

  // QUEUE INSTANCE
  private queue_wallet = null;
  private queue_wallet_events = null;
  private queue_wallet_retry_scheduler = null;
  // QUEUE CONFIG
  private queue_wallet_options = config.queue.bullmq.wallet.options;
  private queue_wallet_name = config.queue.bullmq.wallet.name;

  // JOB INSTANCE
  private job_deposit_action_name = config.queue.bullmq.wallet.job.deposit_action;
  private job_withdraw_action_name = config.queue.bullmq.wallet.job.withdraw_action;
  private job_withdraw_and_waive_action_name = config.queue.bullmq.wallet.job.withdraw_and_waive_action;

  // WORKER INSTANCE
  private worker_wallet = null;
  // WORKER CONFIG
  private worker_wallet_size = config.queue.bullmq.wallet.worker.processor.wallet.options.concurrency;

  // QUEUE CRONJOB INSTANCE
  private cron_queue_cashback_customer = null;
  private cron_queue_cashback_customer_scheduler = null;
  // QUEUE CRONJOB CONFIG
  private cron_queue_cashback_customer_name = config.cron.bullmq.cashback.name;

  // CRON WORKER INSTANCE
  private cron_worker_cashback_customer = null;

  // CRONJOB INSTANCE
  private cronjob_cashback_deposit_customer_monthly = config.cron.bullmq.cashback.cronjob.deposit_customer;
  // CRONJOB CONFIG
  private cronjob_cashback_deposit_customer_monthly_options = config.cron.bullmq.cashback.cronjob.options;

  constructor() {
    this.createURL();

    this.initialQueues();
    this.initialCron();
  }

  static getInstance(): InstanceType<typeof BullMQAdapter> {
    if (!BullMQAdapter.instance) BullMQAdapter.instance = new BullMQAdapter();

    return BullMQAdapter.instance;
  }

  private initialQueues() {
    this.createConnectQueueRedis();

    this.connectWalletQueue();
    this.spawnWalletWorkers();
  }

  private initialCron() {
    this.createConnectCronRedis();

    this.addRepeatableJobAsCron();
  }

  private createURL() {
    const {
      protocol, username, password, host, port,
    } = this.info;

    this.URL = `${protocol}://${username}:${password}@${host}:${port}`;
  }

  private async createConnectQueueRedis() {
    this.connection_queue = new IORedis(this.URL, { maxRetriesPerRequest: null });

    console.info('[BullMQAdapter.createConnectQueueRedis]: Queue connect with Redis successfully, BullMQ has connected with IORedis 🎉');
  }

  private async createConnectCronRedis() {
    this.connection_cron = new IORedis(this.URL, { maxRetriesPerRequest: null });

    console.info('[BullMQAdapter.createConnectCronRedis]: Cron connect with Redis successfully, BullMQ has connected with IORedis 🎉');
  }

  private async connectWalletQueue() {
    this.queue_wallet = new Queue(this.queue_wallet_name, {
      connection: this.connection_queue,
      defaultJobOptions: this.queue_wallet_options,
    });

    this.queue_wallet.on('active', this.queue_active);
    this.queue_wallet.on('failed', this.queue_failed);
    this.queue_wallet.on('progress', this.queue_progress);
    this.queue_wallet.on('stalled', this.queue_stalled);
    this.queue_wallet.on('completed', this.queue_completed);

    this.queue_wallet_retry_scheduler = new QueueScheduler(this.queue_wallet_name, {
      connection: this.connection_queue,
      stalledInterval: 3500,
    });

    this.queue_wallet_retry_scheduler.on('active', this.queue_active);
    this.queue_wallet_retry_scheduler.on('completed', this.queue_completed);
    this.queue_wallet_retry_scheduler.on('failed', this.queue_failed);
    this.queue_wallet_retry_scheduler.on('progress', this.queue_progress);
    this.queue_wallet_retry_scheduler.on('stalled', this.queue_stalled);

    this.queue_wallet_events = new QueueEvents(this.queue_wallet_name, {
      connection: new IORedis(this.URL, { maxRetriesPerRequest: null }),
    });

    this.queue_wallet_events.on('active', this.queue_active);
    this.queue_wallet_events.on('failed', this.queue_failed);
    this.queue_wallet_events.on('progress', this.queue_progress);
    this.queue_wallet_events.on('stalled', this.queue_stalled);
    this.queue_wallet_events.on('completed', this.queue_completed);
    this.queue_wallet_events.on('error', this.queue_error);

    console.info('[BullMQAdapter.connectWalletQueue]: connect wallet queue successfully 🎉');
  }

  private spawnWalletWorkers() {
    this.worker_wallet = new Worker(this.queue_wallet_name, async (job) => (await WalletProcessor(job)), {
      connection: new IORedis(this.URL, { maxRetriesPerRequest: null }),
      concurrency: this.worker_wallet_size,
    });

    this.worker_wallet.on('drained', this.worker_drained);
    this.worker_wallet.on('completed', this.worker_completed);
    this.worker_wallet.on('failed', this.worker_failed);
    this.worker_wallet.on('error', this.worker_error);

    console.info('[BullMQAdapter.spawnWalletWorkers]: spawn wallet worker successfully 🎉');
  }

  private queue_active(payload: JobPayload) {
    console.info(`[QueueWallet.active]: job activating..., jobId:${payload.jobId}`);
  }

  private queue_completed(payload: JobPayload) {
    console.info(`[QueueWallet.completed]: job completed, jobId:${payload.jobId}`);
  }

  private queue_stalled(payload: JobPayload) {
    console.info(`[QueueWallet.stalled]: job is stalled, jobId:${payload.jobId}`);
  }

  private queue_progress(payload: JobPayload) {
    console.info(`[QueueWallet.progress]: job in progress..., jobId:${payload.jobId}, data: ${payload.data}`);
  }

  private queue_error(payload: JobPayload) {
    LError(`[QueueWallet.error]: unable to consume the message because ${payload.failedReason}, jobId:${payload.jobId}`);
  }

  private queue_failed(payload: JobPayload) {
    LError(`[QueueWallet.failed]: unable to consume the message because ${payload.failedReason}, jobId:${payload.jobId}`);
  }

  private worker_drained() {
    console.info('[WorkerWallet.drained]: drained');
  }

  private worker_completed({ name, id }: Job) {
    console.info(`[WorkerWallet.completed]: completed jobName:${name}, jobId:${id}`);
  }

  private worker_error(payload: JobPayload) {
    LError(`[QueueWallet.error]: unable to consume the message because ${payload.failedReason}, jobId:${payload.jobId}`);
  }

  private async worker_failed(job: Job) {
    const { name, id, attemptsMade } = job;

    if (attemptsMade === config.queue.bullmq.wallet.options.attempts) {
      try {
        await jobEventFailedRepo.saveJobEventFailed(job as any);

        console.info('[WorkerWallet.failed]: ✅ save job event failed to database successfully');
      } catch (error) {
        LError(`[WorkerWallet.failed]: 🚨 unable to save job event failed to database, you have to find the event in Redis, jobName:${name}, jobId:${id}, attemptsMade:${attemptsMade}`, error);
      }
    }

    LError(`[WorkerWallet.failed]: failed jobName:${name}, jobId:${id}, attemptsMade:${attemptsMade}/${config.queue.bullmq.wallet.options.attempts}`);
  }

  private async addRepeatableJobAsCron() {
    this.cron_queue_cashback_customer = new Queue(this.cron_queue_cashback_customer_name, {
      connection: this.connection_cron,
    });

    this.queue_wallet.on('active', this.queue_active);
    this.queue_wallet.on('failed', this.queue_failed);
    this.queue_wallet.on('progress', this.queue_progress);
    this.queue_wallet.on('stalled', this.queue_stalled);
    this.queue_wallet.on('completed', this.queue_completed);

    this.cron_queue_cashback_customer_scheduler = new QueueScheduler(this.cron_queue_cashback_customer_name, {
      connection: this.connection_cron,
    });

    this.queue_wallet_retry_scheduler.on('active', this.queue_active);
    this.queue_wallet_retry_scheduler.on('completed', this.queue_completed);
    this.queue_wallet_retry_scheduler.on('failed', this.queue_failed);
    this.queue_wallet_retry_scheduler.on('progress', this.queue_progress);
    this.queue_wallet_retry_scheduler.on('stalled', this.queue_stalled);

    // this.queue_wallet_events = new QueueEvents(this.queue_wallet_name, {
    //   connection: new IORedis(this.URL, { maxRetriesPerRequest: null }),
    // });

    await this.spawnCronWorkers();

    await this.cron_queue_cashback_customer.waitUntilReady();
    await this.cron_queue_cashback_customer_scheduler.waitUntilReady();

    await this.cron_queue_cashback_customer.add(
      this.cronjob_cashback_deposit_customer_monthly,
      {
        cronSchedule: this.cronjob_cashback_deposit_customer_monthly_options.repeat.cron,
        addedAt: toDateTHTimeZoneByDate().toISOString(),
      },
      this.cronjob_cashback_deposit_customer_monthly_options,
    );

    console.info(`[CronJobCustomerCashback.addRepeatableJobAsCron]: start schedule successfully, cronjob:${this.cronjob_cashback_deposit_customer_monthly}, schedule:${this.cronjob_cashback_deposit_customer_monthly_options.repeat.cron}`);
  }

  private async spawnCronWorkers() {
    this.cron_worker_cashback_customer = new Worker(
      this.cron_queue_cashback_customer_name,
      async (job: Job) => {
        const { data: payload } = job;
        const { cronSchedule, addedAt } = payload;

        const customers = await customerRepo.findAllCustomerActive();
        // TODO: make idempotent, have to check state of month that cashback already deposit

        const today = toDateTHTimeZoneByDate();

        const startMonth = today.getMonth() - 1 < 0 ? 13 : today.getMonth() - 1;
        const endMonth = today.getMonth();

        const dateStartPrevMonth = toDateTHTimeZoneByDate(new Date(today.getFullYear(), startMonth, 1)).toISOString().split('T')[0];
        const dateEndPrevMonth = toDateTHTimeZoneByDate(new Date(today.getFullYear(), endMonth, 0)).toISOString().split('T')[0];

        console.info(`[CashbackCustomerProcessor.CashbackCustomerProcessor]: starting, cashback to customer successfully, jobId:${job.id}, dateStartPrevMonth:${dateStartPrevMonth}, dateEndPrevMonth:${dateEndPrevMonth}, cronSchedule:${cronSchedule}, addedAt:${addedAt}`);

        const promise = customers.map(async (customer: Customer) => {
          if (customer.mobileNumber !== '0873370808') return;

          try {
            const report = await walletClient.summaryReport({
              username: customer.mobileNumber,
              dateStart: dateStartPrevMonth,
              dateEnd: dateEndPrevMonth,
            });

            const { cashback } = report;

            if (cashback >= 0) {
              console.info(`[CashbackCustomerProcessor.CashbackCustomerProcessor]: deposit cashback to customer skip..., jobId:${job.id}`);

              return;
            }

            const hashCashback = generateHashCashback(customer.mobileNumber, dateStartPrevMonth, dateEndPrevMonth);
            await cashbackRepo.saveCashbackHistoryFailed({
              ...report,
              username: customer.mobileNumber,
              hash: hashCashback,
              dateStart: dateStartPrevMonth,
              dateEnd: dateEndPrevMonth,
              status: 'success',
            });

            const [hash] = generateHashTransaction(customer.bankAccountNumber, customer.mobileNumber, cashback);
            this.produceDepositJob({
              username: customer.mobileNumber,
              amount: cashback,
              hash,
            });

            console.info(`[CashbackCustomerProcessor.CashbackCustomerProcessor]: ✅ deposit cashback to customer successfully, jobId:${job.id}`);
          } catch (error) {
            LError(`[CashbackCustomerProcessor.CashbackCustomerProcessor]: unable to deposit cashback to customer, username:${customer.mobileNumber}, dateStartPrevMonth:${dateStartPrevMonth}, dateEndPrevMonth:${dateEndPrevMonth}`, error);
          }
        });

        await Promise.all(promise);
      },
      {
        connection: new IORedis(this.URL, { maxRetriesPerRequest: null }),
      },
    );

    this.cron_worker_cashback_customer.on('drained', this.worker_drained);
    this.cron_worker_cashback_customer.on('completed', this.worker_completed);
    this.cron_worker_cashback_customer.on('failed', this.worker_failed);
    this.cron_worker_cashback_customer.on('error', this.worker_error);

    console.info('[BullMQAdapter.spawnCronWorkers]: spawn cashback cron worker successfully 🎉');
  }

  public async produceDepositJob(transaction: DepositRequest) {
    try {
      await this.queue_wallet.waitUntilReady();
      await this.queue_wallet_retry_scheduler.waitUntilReady();
      await this.queue_wallet_events.waitUntilReady();

      const job = await this.queue_wallet.add(this.job_deposit_action_name, transaction);

      await job.waitUntilFinished(this.queue_wallet_events);
    } catch (error) {
      throw LError(`[BullMQAdapter.produceDepositJob]: unable to produce message to deposit job, hash:${transaction.hash}`, error);
    }
  }

  public async produceWithdrawJob(transaction: WithdrawRequest) {
    try {
      await this.queue_wallet.waitUntilReady();
      await this.queue_wallet_retry_scheduler.waitUntilReady();
      await this.queue_wallet_events.waitUntilReady();

      const job = await this.queue_wallet.add(this.job_withdraw_action_name, transaction);

      await job.waitUntilFinished(this.queue_wallet_events);
    } catch (error) {
      throw LError(`[BullMQAdapter.produceWithdrawJob]: unable to produce message to withdraw job, hash:${transaction.hash}`, error);
    }
  }

  public async produceWithdrawJobAndWaive(transaction: WithdrawAndWaiveRequest) {
    try {
      await this.queue_wallet.waitUntilReady();
      await this.queue_wallet_retry_scheduler.waitUntilReady();
      await this.queue_wallet_events.waitUntilReady();

      const job = await this.queue_wallet.add(this.job_withdraw_and_waive_action_name, transaction);

      await job.waitUntilFinished(this.queue_wallet_events);
    } catch (error) {
      throw LError(`[BullMQAdapter.produceWithdrawJobAndWaive]: unable to produce message to withdraw and waive job, hash:${transaction.hash}`, error);
    }
  }
}

export default BullMQAdapter;
