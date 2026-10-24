import {
  Schema,
  type InferSchemaType,
  type Types,
  model,
  models,
} from "mongoose";

import { ORDER_STATUSES, PAYMENT_METHODS } from "@/lib/constants";

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const orderItemSchema = new Schema(
  {
    gemstoneId: { type: Schema.Types.ObjectId, ref: "Gemstone", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true, enum: ORDER_STATUSES },
    note: { type: String, trim: true },
    at: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: customerSchema, required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "An order must have at least one item.",
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: PAYMENT_METHODS,
      default: "cod",
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type Order = InferSchemaType<typeof orderSchema> & {
  items: Array<
    InferSchemaType<typeof orderItemSchema> & { gemstoneId: Types.ObjectId }
  >;
};

export const OrderModel = models.Order ?? model("Order", orderSchema);
