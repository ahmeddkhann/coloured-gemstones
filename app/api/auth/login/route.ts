import bcrypt from "bcryptjs";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";
import { issueLoginOtp } from "@/lib/otp";
import { loginSchema } from "@/lib/validations";

const DUMMY_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8xkqHq1nR3mGq0cYkOQb5mYk5mYk5m";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();

    const email = parsed.data.email.toLowerCase();
    const admin = await AdminModel.findOne({ email }).select("+passwordHash");

    const hash = admin?.passwordHash ?? DUMMY_HASH;
    const passwordOk = await bcrypt.compare(parsed.data.password, hash);

    if (!admin || !passwordOk) {
      return jsonError("Invalid email or password.", 401);
    }

    const issued = await issueLoginOtp(email, { reason: "signin" });
    if (!issued.ok) {
      return jsonError("Please wait before requesting another code.", 429);
    }

    return jsonOk({ message: "A sign-in code was sent to your email." });
  } catch (error) {
    return handleRouteError(error);
  }
}
