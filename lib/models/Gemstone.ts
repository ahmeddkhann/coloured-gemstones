import { Schema, type InferSchemaType, model, models } from "mongoose";

import { GEMSTONE_TYPES } from "@/lib/constants";

const gemstoneImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const gemstoneSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: GEMSTONE_TYPES },
    color: { type: String, required: true, trim: true },
    cut: { type: String, required: true, trim: true },
    clarity: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    carat: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [gemstoneImageSchema], default: [] },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

gemstoneSchema.index({
  name: "text",
  type: "text",
  color: "text",
  origin: "text",
});

export type Gemstone = InferSchemaType<typeof gemstoneSchema>;

export const GemstoneModel =
  models.Gemstone ?? model("Gemstone", gemstoneSchema);
