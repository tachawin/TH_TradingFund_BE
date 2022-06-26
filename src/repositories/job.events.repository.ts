/* eslint-disable no-use-before-define */
import { model, Model } from 'mongoose';

import config from '../config/config';

import {
  JobEventSchema,
  JobEventDocument,
  JobEventResponse,
  JobEvent,
} from '../entities/schemas/job.events.schema';

import { LError } from '../helper/errors.handler';

class JobEventsRepository {
  private static instance: JobEventsRepository;
  private _model: Model<JobEventDocument>;
  private collection: string;

  constructor() {
    this.collection = config.db.mongo.collections.job_events_failed;
    this._model = model<JobEventDocument>(this.collection, JobEventSchema);
  }

  public static getInstance(): JobEventsRepository {
    if (!JobEventsRepository.instance) {
      JobEventsRepository.instance = new JobEventsRepository();
    }

    return JobEventsRepository.instance;
  }

  public async saveJobEventFailed(transaction: JobEvent): JobEventResponse {
    const mongooseModel = new this._model(transaction);
    try {
      const { _doc: result } = await mongooseModel.save() as any;

      return result;
    } catch (error) {
      throw LError('[JobEventsRepository.saveJobEventFailed]: unable to save failed job event in to database', error);
    }
  }
}

export default JobEventsRepository;
