import * as mongoose from 'mongoose';
import { validateMobileNumber } from './validator';

export interface ReferralList {
  customerId: string
  firstReferralList: Array<string>
  secondReferralList: Array<string>
  parentCustomerId?: string
  createdAt?: Date
  updatedAt?: Date
}

export type ReferralListResponse = Promise<ReferralList>;
export type ReferralListDocument = ReferralList & mongoose.Document;

const schema = new mongoose.Schema<ReferralList>(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    firstReferralList: [{
      type: String,
      validate: validateMobileNumber,
      trim: true,
      default: [],
    }],
    secondReferralList: [{
      type: String,
      validate: validateMobileNumber,
      trim: true,
      default: [],
    }],
    parentCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ customerId: 1 }, { unique: true });

export const ReferralListSchema = schema;
