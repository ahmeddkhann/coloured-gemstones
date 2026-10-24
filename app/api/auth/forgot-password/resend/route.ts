import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";
import { issueOtp } from "@/lib/otp";
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
    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      return jsonError("No admin account uses this email.", 404);
    }

    const issued = await issueOtp(email, "reset", { reason: "reset" });
    if (!issued.ok) {
      return jsonError("Please wait before requesting another code.", 429);
    }

    return jsonOk({ message: "A new reset code was sent to your email." });
  } catch (error) {
    return handleRouteError(error);
  }
}
