import { Schema, type InferSchemaType, model, models } from "mongoose";

import { ADMIN_ROLES } from "@/lib/constants";

const adminSchema = new Schema(
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
    role: { type: String, required: true, enum: ADMIN_ROLES, default: "admin" },
  },
  { timestamps: true },
);

export type Admin = InferSchemaType<typeof adminSchema>;

export const AdminModel = models.Admin ?? model("Admin", adminSchema);
