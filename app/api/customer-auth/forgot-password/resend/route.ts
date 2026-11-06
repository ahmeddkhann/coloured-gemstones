import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { issueOtp } from "@/lib/otp";
import { customerForgotSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = customerForgotSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();
    const email = parsed.data.email.toLowerCase();
    const customer = await CustomerModel.findOne({ email });
    if (!customer) {
      return jsonError("No account uses this email.", 404);
    }

    const issued = await issueOtp(email, "reset", { reason: "reset" });
    if (!issued.ok) {
      return jsonError("Please wait before requesting another code.", 429);
    }

    return jsonOk({ message: "A new code was sent to your email." });
  } catch (error) {
    return handleRouteError(error);
  }
}
