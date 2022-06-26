/* eslint-disable no-unused-vars */
import * as mongoose from 'mongoose';

import { EventRequests } from '../dtos/wallet.dtos';

export interface JobEvent {
  jobEventId?: string
  failedReason: string
  attemptsMade: number
  timestamp: number
  data: EventRequests
  priority: number
  opts: any
  stacktrace: string[]
  delay: number
  finishedOn: number
  processedOn: number
  name: string
  createdAt?: Date
  updatedAt?: Date
}

export type JobEventResponse = Promise<JobEvent>
export type JobEventDocument = JobEvent & mongoose.Document

const schema = new mongoose.Schema<JobEvent>(
  {
    jobEventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    failedReason: {
      type: String,
      default: '',
    },
    attemptsMade: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Number,
      default: 0,
    },
    data: {
      type: Object,
    },
    priority: {
      type: Number,
      default: 0,
    },
    opts: {
      type: Object,
    },
    stacktrace: {
      type: [String],
    },
    delay: {
      type: Number,
      default: 0,
    },
    finishedOn: {
      type: Number,
      default: 0,
    },
    processedOn: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      default: '',
    },

  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ jobEventId: 1 }, { unique: true });

schema.index({ createdAt: 1 });

export const JobEventSchema = schema;
