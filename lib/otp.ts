import "server-only";

import { randomInt } from "crypto";

import bcrypt from "bcryptjs";

import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  type OtpPurpose,
} from "@/lib/constants";
import { sendOtpEmail } from "@/lib/mail";
import { OtpModel } from "@/lib/models/Otp";

export async function issueOtp(
  email: string,
  purpose: OtpPurpose,
  options?: { skipCooldown?: boolean; reason?: "signin" | "signup" | "reset" },
) {
  const latest = await OtpModel.findOne({
    email,
    purpose,
    consumed: false,
  }).sort({ createdAt: -1 });

  if (
    !options?.skipCooldown &&
    latest?.createdAt &&
    Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    return { ok: false as const, reason: "cooldown" as const };
  }

  await OtpModel.updateMany(
    { email, purpose, consumed: false },
    { $set: { consumed: true } },
  );

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);

  await OtpModel.create({
    email,
    codeHash,
    purpose,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    consumed: false,
  });

  try {
    await sendOtpEmail(email, code, options?.reason ?? "signin");
  } catch (error) {
    console.error("[mail] Failed to send OTP email.", error);
    throw error;
  }

  return { ok: true as const };
}

export async function issueLoginOtp(
  email: string,
  options?: { skipCooldown?: boolean; reason?: "signin" | "signup" },
) {
  return issueOtp(email, "login", options);
}

export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose,
) {
  const otp = await OtpModel.findOne({
    email,
    purpose,
    consumed: false,
  }).sort({ createdAt: -1 });

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, reason: "invalid" as const };
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    otp.consumed = true;
    await otp.save();
    return { ok: false as const, reason: "locked" as const };
  }

  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    otp.attempts += 1;
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      otp.consumed = true;
    }
    await otp.save();
    return { ok: false as const, reason: "invalid" as const };
  }

  otp.consumed = true;
  await otp.save();
  return { ok: true as const };
}

export async function verifyLoginOtp(email: string, code: string) {
  return verifyOtp(email, code, "login");
}
