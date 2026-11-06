import bcrypt from "bcryptjs";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import {
  clearCustomerResetCookie,
  getCustomerResetEmail,
  verifyCustomerResetToken,
} from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { customerResetPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = customerResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    const emailFromCookie = await getCustomerResetEmail();
    const emailFromBody = parsed.data.resetToken
      ? await verifyCustomerResetToken(parsed.data.resetToken)
      : null;
    const email = emailFromCookie ?? emailFromBody;

    if (!email) {
      return jsonError("Verify your email code first.", 401);
    }

    await connectDB();
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const customer = await CustomerModel.findOneAndUpdate(
      { email },
      { $set: { passwordHash } },
      { returnDocument: "after" },
    );

    if (!customer) {
      return jsonError("No account uses this email.", 404);
    }

    await clearCustomerResetCookie();
    return jsonOk({
      message: "Password updated. Sign in with your new password.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
