import { Schema, Types } from "mongoose";

export interface ISecretRemainder {
  _id: Types.ObjectId;
  cron: string;
  note: string;
}

export const secretRemainderSchema = new Schema<ISecretRemainder>({
  cron: {
    type: String,
    required: true
  },
  note: {
    type: String,
    required: true
  }
});
