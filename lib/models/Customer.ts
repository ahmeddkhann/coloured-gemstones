import { Schema, type InferSchemaType, model, models } from "mongoose";

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type Customer = InferSchemaType<typeof customerSchema>;

export const CustomerModel =
  models.Customer ?? model("Customer", customerSchema);
