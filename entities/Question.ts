import { Schema, model } from 'mongoose';
import { baseSchema, IBase } from './Base';
import { Org } from './Org';

export interface IQuestion extends IBase {
  totalStages: 0;
  title: string;
  org: Schema.Types.ObjectId;
  description?: string;
}

export const questionSchema = new Schema<IQuestion>({
  ...baseSchema.obj,
  totalStages: { type: Number, default: 0 },
  title: { type: String, required: true },
  description: String,
  org: { type: Schema.Types.ObjectId, ref: Org },
});

export const Question = model<IQuestion>('Question', questionSchema);