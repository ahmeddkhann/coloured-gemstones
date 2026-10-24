import bcrypt from "bcryptjs";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { sendAdminInviteEmail } from "@/lib/mail";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";
import { requireAdmin } from "@/lib/require-admin";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    const body = await readJson(request);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();

    const email = parsed.data.email.toLowerCase();
    const taken = await AdminModel.findOne({ email });
    if (taken) {
      return jsonError("An account with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await AdminModel.create({
      name: parsed.data.name,
      email,
      passwordHash,
      role: "admin",
    });

    await sendAdminInviteEmail({
      name: parsed.data.name,
      email,
      password: parsed.data.password,
    });

    return jsonOk(
      { message: "Admin added. Their password was emailed with a sign-in link." },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
