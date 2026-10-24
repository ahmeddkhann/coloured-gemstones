import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { OtpModel } from "@/lib/models/Otp";
import { issueLoginOtp } from "@/lib/otp";
import { otpResendSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = otpResendSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();

    const email = parsed.data.email.toLowerCase();
    const challenge = await OtpModel.findOne({
      email,
      purpose: "login",
    }).sort({ createdAt: -1 });

    if (!challenge) {
      return jsonError("Sign in first to request a code.", 400);
    }

    const issued = await issueLoginOtp(email);
    if (!issued.ok) {
      return jsonError("Please wait before requesting another code.", 429);
    }

    return jsonOk({ message: "A new sign-in code was sent to your email." });
  } catch (error) {
    return handleRouteError(error);
  }
}
