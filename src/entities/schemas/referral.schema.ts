import * as mongoose from 'mongoose';

export interface Referral {
  referralId: string
  parentCustomerId: string
  childCustomerId: string
  createdAt?: Date
  updatedAt?: Date
}

const schema = new mongoose.Schema<Referral>(
  {
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    parentCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    childCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ referralId: 1 }, { unique: true });
schema.index({ parentCustomerId: 1, childCustomerId: 1 }, { unique: true });

export const ReferralSchema = schema;
