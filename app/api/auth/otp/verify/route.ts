import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { setAdminCookie, signAdminToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";
import { verifyLoginOtp } from "@/lib/otp";
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
    const result = await verifyLoginOtp(email, parsed.data.code);

    if (!result.ok) {
      const message =
        result.reason === "locked"
          ? "Too many attempts. Sign in again."
          : "Invalid or expired code.";
      return jsonError(message, 401);
    }

    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      return jsonError("Invalid or expired code.", 401);
    }

    let token: string;
    try {
      token = await signAdminToken({
        adminId: admin._id.toString(),
        email: admin.email,
        role: "admin",
      });
    } catch {
      return jsonError(
        "ADMIN_SESSION_SECRET is missing or too short. Add a 32+ character value to .env.local and restart the app.",
        500,
      );
    }
    await setAdminCookie(token);

    return jsonOk({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
