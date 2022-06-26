/* eslint-disable no-return-await */
/* eslint-disable import/no-named-as-default */
// import path from 'path';
import {
  Queue, QueueScheduler, Worker, Job, QueueEvents,
} from 'bullmq';
import IORedis from 'ioredis';

import config from '../config/config';

import { DepositRequest, WithdrawRequest, WithdrawAndWaiveRequest } from '../entities/dtos/wallet.dtos';

import { LError } from '../helper/errors.handler';

import JobEventsRepository from '../repositories/job.events.repository';

import { WalletProcessor } from '../workers/wallet.worker';

const jobEventFailedRepo = JobEventsRepository.getInstance();

interface JobPayload {
  jobId: string
  failedReason?: string
  returnvalue?: any
  data?: any
}

class BullMQAdapter {
  static instance = null;

  private connection = null;
  private URL = '';

  private info = {
    protocol: config.db.redis.protocol,
    username: config.db.redis.username,
    password: config.db.redis.password,
    host: config.db.redis.host,
    port: config.db.redis.port,
    database: config.db.redis.database,
  };

  private queue_wallet_options = config.queue.bullmq.wallet.options;
  private queue_wallet_name = config.queue.bullmq.wallet.name;

  private job_deposit_action_name = config.queue.bullmq.wallet.job.deposit_action;
  private job_withdraw_action_name = config.queue.bullmq.wallet.job.withdraw_action;
  private job_withdraw_and_waive_action_name = config.queue.bullmq.wallet.job.withdraw_and_waive_action;

  private queue_wallet = null;
  private queue_wallet_events = null;
  private queue_wallet_retry_scheduler = null;

  private worker_wallet = null;
  private worker_wallet_processor_path = config.queue.bullmq.wallet.worker.processor.wallet.path;
  private worker_wallet_size = config.queue.bullmq.wallet.worker.processor.wallet.options.concurrency;

  constructor() {
    this.createURL();
    this.connectRedis();

    this.connectWalletQueue();
    this.spawnWalletWorkers();
  }

  static getInstance(): InstanceType<typeof BullMQAdapter> {
    if (!BullMQAdapter.instance) BullMQAdapter.instance = new BullMQAdapter();

    return BullMQAdapter.instance;
  }

  private createURL() {
    const {
      protocol, username, password, host, port,
    } = this.info;

    this.URL = `${protocol}://${username}:${password}@${host}:${port}`;
  }

  private async connectRedis() {
    this.connection = new IORedis(this.URL);

    console.log('[BullMQAdapter.connected]: BullMQ has connected with IORedis 🎉');
  }

  private async connectWalletQueue() {
    this.queue_wallet = new Queue(this.queue_wallet_name, {
      connection: this.connection,
      defaultJobOptions: this.queue_wallet_options,
    });

    this.queue_wallet.on('active', this.queue_active);
    this.queue_wallet.on('failed', this.queue_failed);
    this.queue_wallet.on('progress', this.queue_progress);
    this.queue_wallet.on('stalled', this.queue_stalled);
    this.queue_wallet.on('completed', this.queue_completed);

    this.queue_wallet_retry_scheduler = new QueueScheduler(this.queue_wallet_name, {
      connection: this.connection,
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

    console.log('[BullMQAdapter.connectWalletQueue]: connect wallet queue successfully 🎉');
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

    console.log('[BullMQAdapter.spawnWalletWorkers]: spawn wallet worker successfully 🎉');
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
    LError(`[QueueWallet.error]: unable to consume the message because ${payload.failedReason}, jobId:${payload.jobId},`);
  }

  private queue_failed(payload: JobPayload) {
    LError(`[QueueWallet.failed]: unable to consume the message because ${payload.failedReason}, jobId:${payload.jobId},`);
  }

  private worker_drained() {
    console.log('[WorkerWallet.drained]: drained');
  }

  private worker_completed({ name, id }: Job) {
    console.log(`[WorkerWallet.completed]: completed jobName:${name}, jobId:${id}`);
  }

  private worker_error(payload: JobPayload) {
    LError(`[QueueWallet.error]: unable to consume the message because ${payload.failedReason}, jobId:${payload.jobId},`);
  }

  private async worker_failed(job: Job) {
    const { name, id, attemptsMade } = job;

    if (attemptsMade === config.queue.bullmq.wallet.options.attempts) {
      try {
        await jobEventFailedRepo.saveJobEventFailed(job as any);

        console.info('[WorkerWallet.failed]: ✅ save job event failed to database successfully', job);
      } catch (error) {
        LError(`[WorkerWallet.failed]: 🚨 unable to save job event failed to database, you have to find the event in Redis, jobName:${name}, jobId:${id}, attemptsMade:${attemptsMade}`);
      }
    }

    LError(`[WorkerWallet.failed]: failed jobName:${name}, jobId:${id}, attemptsMade:${attemptsMade}/${config.queue.bullmq.wallet.options.attempts}`);
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
