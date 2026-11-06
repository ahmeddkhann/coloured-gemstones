import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { getPendingSignup } from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { issueOtp } from "@/lib/otp";
import { otpResendSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = otpResendSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    const pending = await getPendingSignup();
    if (!pending) {
      return jsonError("Sign-up session expired. Start again.", 401);
    }

    const email = parsed.data.email.toLowerCase();
    if (email !== pending.email) {
      return jsonError("Email does not match the pending sign-up.", 400);
    }

    await connectDB();
    const issued = await issueOtp(email, "signup", { reason: "signup" });
    if (!issued.ok) {
      return jsonError("Please wait before requesting another code.", 429);
    }

    return jsonOk({ message: "A new code was sent to your email." });
  } catch (error) {
    return handleRouteError(error);
  }
}
