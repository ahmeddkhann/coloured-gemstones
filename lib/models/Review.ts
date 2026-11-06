import {
  Schema,
  type InferSchemaType,
  type Types,
  model,
  models,
} from "mongoose";

const reviewSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    gemstoneId: {
      type: Schema.Types.ObjectId,
      ref: "Gemstone",
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

reviewSchema.index({ customerId: 1, gemstoneId: 1 }, { unique: true });

export type Review = InferSchemaType<typeof reviewSchema> & {
  customerId: Types.ObjectId;
  gemstoneId: Types.ObjectId;
  orderId: Types.ObjectId;
};

export const ReviewModel = models.Review ?? model("Review", reviewSchema);
