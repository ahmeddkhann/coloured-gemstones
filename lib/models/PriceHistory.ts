import {
  Schema,
  type InferSchemaType,
  type Types,
  model,
  models,
} from "mongoose";

const priceHistorySchema = new Schema(
  {
    gemstoneId: {
      type: Schema.Types.ObjectId,
      ref: "Gemstone",
      required: true,
      index: true,
    },
    oldPrice: { type: Number, required: true, min: 0 },
    newPrice: { type: Number, required: true, min: 0 },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    changedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: false },
);

priceHistorySchema.index({ gemstoneId: 1, changedAt: -1 });

export type PriceHistory = InferSchemaType<typeof priceHistorySchema> & {
  gemstoneId: Types.ObjectId;
  changedBy: Types.ObjectId;
};

export const PriceHistoryModel =
  models.PriceHistory ?? model("PriceHistory", priceHistorySchema);
