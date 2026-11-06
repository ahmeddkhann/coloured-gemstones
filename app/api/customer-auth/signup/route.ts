import bcrypt from "bcryptjs";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import {
  setPendingSignupCookie,
  signPendingSignupToken,
} from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { issueOtp } from "@/lib/otp";
import { customerSignupSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = customerSignupSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();

    const email = parsed.data.email.toLowerCase();
    const taken = await CustomerModel.findOne({ email });
    if (taken) {
      return jsonError("An account with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const signupToken = await signPendingSignupToken({
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone.trim(),
      address: parsed.data.address.trim(),
      passwordHash,
      purpose: "signup",
    });
    await setPendingSignupCookie(signupToken);

    const issued = await issueOtp(email, "signup", {
      skipCooldown: true,
      reason: "signup",
    });
    if (!issued.ok) {
      return jsonError("Please wait before requesting another code.", 429);
    }

    return jsonOk({
      message: "A verification code was sent to your email.",
      email,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
