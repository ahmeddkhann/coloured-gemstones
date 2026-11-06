import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import {
  clearPendingSignupCookie,
  getPendingSignup,
  setCustomerCookie,
  signCustomerToken,
} from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { verifyOtp } from "@/lib/otp";
import { otpVerifySchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = otpVerifySchema.safeParse(body);
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
    const result = await verifyOtp(email, parsed.data.code, "signup");
    if (!result.ok) {
      const message =
        result.reason === "locked"
          ? "Too many attempts. Request a new code."
          : "Invalid or expired code.";
      return jsonError(message, 401);
    }

    const existing = await CustomerModel.findOne({ email });
    if (existing) {
      await clearPendingSignupCookie();
      return jsonError("An account with this email already exists.", 409);
    }

    const customer = await CustomerModel.create({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      address: pending.address,
      passwordHash: pending.passwordHash,
    });

    const token = await signCustomerToken({
      customerId: String(customer._id),
      email: customer.email,
      role: "customer",
    });
    await setCustomerCookie(token);
    await clearPendingSignupCookie();

    return jsonOk({
      customer: {
        id: String(customer._id),
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
