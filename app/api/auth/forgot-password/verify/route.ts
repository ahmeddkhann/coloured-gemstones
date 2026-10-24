import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { setResetCookie, signResetToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { verifyOtp } from "@/lib/otp";
import { otpVerifySchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();
    const email = parsed.data.email.toLowerCase();
    const result = await verifyOtp(email, parsed.data.code, "reset");

    if (!result.ok) {
      const message =
        result.reason === "locked"
          ? "Too many attempts. Request a new code."
          : "Invalid or expired code.";
      return jsonError(message, 401);
    }

    const resetToken = await signResetToken(email);
    await setResetCookie(resetToken);

    return jsonOk({ email, resetToken });
  } catch (error) {
    return handleRouteError(error);
  }
}
