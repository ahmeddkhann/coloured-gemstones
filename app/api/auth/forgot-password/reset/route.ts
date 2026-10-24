import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { z } from "zod";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { clearResetCookie, getResetEmail } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirm password is required."),
  resetToken: z.string().optional(),
});

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }
  return new TextEncoder().encode(
    "coloured-gemstones-dev-session-secret-change-me",
  );
}

async function emailFromToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "reset" || typeof payload.email !== "string") {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }
    if (parsed.data.password !== parsed.data.confirmPassword) {
      return jsonError("New password and confirm password must match.", 400);
    }

    const emailFromCookie = await getResetEmail();
    const emailFromBody = parsed.data.resetToken
      ? await emailFromToken(parsed.data.resetToken)
      : null;
    const email = emailFromCookie ?? emailFromBody;

    if (!email) {
      return jsonError("Verify your email code first.", 401);
    }

    await connectDB();
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const admin = await AdminModel.findOneAndUpdate(
      { email },
      { $set: { passwordHash } },
      { returnDocument: "after" },
    );

    if (!admin) {
      return jsonError("No admin account uses this email.", 404);
    }

    await clearResetCookie();
    return jsonOk({ message: "Password updated. Sign in with your new password." });
  } catch (error) {
    return handleRouteError(error);
  }
}
