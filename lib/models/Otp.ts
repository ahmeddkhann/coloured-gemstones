import mongoose, { Schema, type InferSchemaType, model } from "mongoose";

import { OTP_PURPOSES } from "@/lib/constants";

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      required: true,
      enum: [...OTP_PURPOSES],
      default: "login",
    },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1, consumed: 1 });

export type Otp = InferSchemaType<typeof otpSchema>;

if (mongoose.models.Otp) {
  delete mongoose.models.Otp;
}

export const OtpModel = model("Otp", otpSchema);
