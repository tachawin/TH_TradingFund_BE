import * as mongoose from 'mongoose';

export interface Announcement {
  announcementId: string
  adminId: string
  title: string
  description: string
  visibility: string
  createdAt?: Date
  updatedAt?: Date
}

const schema = new mongoose.Schema<Announcement>(
  {
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
      auto: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
    },
    title: {
      type: String,
      index: true,
      required: true,
    },
    description: {
      type: String,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

schema.index({ announcementId: 1 }, { unique: true });

schema.index({ adminId: 1 });

schema.index({ visibility: 1, createdAt: 1 });

export const AnnouncementSchema = schema;
