import { Schema, model, models, type Document, type Model } from 'mongoose';

export type LesserGreaterEqual = 'lesser' | 'equal' | 'greater';
export type AlertFrequency = 'minute' | 'hour' | 'day';

export interface AlertDoc extends Document {
  userId: string;
  symbol: string;
  company?: string;
  alertPrice: number;
  lesserGreaterEqual: LesserGreaterEqual;
  alertFrequency: AlertFrequency;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<AlertDoc>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, trim: true, uppercase: true },
    company: { type: String, trim: true },
    alertPrice: { type: Number, required: true, min: 0 },
    lesserGreaterEqual: {
      type: String,
      enum: ['lesser', 'equal', 'greater'],
      required: true,
      default: 'greater',
    },
    alertFrequency: {
      type: String,
      enum: ['minute', 'hour', 'day'],
      required: true,
      default: 'day',
    },
  },
  { timestamps: true, collection: 'alerts' }
);

// Prevent duplicate symbol alerts per user
AlertSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Alerts: Model<AlertDoc> =
  (models?.Alerts as Model<AlertDoc>) || model<AlertDoc>('Alerts', AlertSchema);

export default Alerts;
