import bcrypt from "bcryptjs";
import { z } from "zod";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";
import { requireAdmin } from "@/lib/require-admin";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});

export async function GET() {
  try {
    const result = await requireAdmin();
    if (result.error) {
      return result.error;
    }

    await connectDB();
    const admin = await AdminModel.findById(result.admin.adminId);
    if (!admin) {
      return jsonError("Unauthorized.", 401);
    }

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

export async function PATCH(request: Request) {
  try {
    const result = await requireAdmin();
    if (result.error) {
      return result.error;
    }

    const body = await readJson(request);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    const newPassword = parsed.data.newPassword ?? "";
    const confirmPassword = parsed.data.confirmPassword ?? "";

    if (newPassword) {
      if (!parsed.data.currentPassword) {
        return jsonError("Current password is required to change the password.", 400);
      }
      if (newPassword.length < 8) {
        return jsonError("New password must be at least 8 characters.", 400);
      }
      if (newPassword !== confirmPassword) {
        return jsonError("New password and confirm password must match.", 400);
      }
    }

    await connectDB();

    const updates: { name: string; passwordHash?: string } = {
      name: parsed.data.name,
    };

    if (newPassword) {
      const admin = await AdminModel.findById(result.admin.adminId).select(
        "+passwordHash",
      );
      if (!admin) {
        return jsonError("Unauthorized.", 401);
      }

      const passwordOk = await bcrypt.compare(
        parsed.data.currentPassword ?? "",
        admin.passwordHash,
      );
      if (!passwordOk) {
        return jsonError("Current password is incorrect.", 401);
      }

      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await AdminModel.findByIdAndUpdate(result.admin.adminId, { $set: updates });

    const saved = await AdminModel.findById(result.admin.adminId);
    if (!saved) {
      return jsonError("Unauthorized.", 401);
    }

    return jsonOk({
      id: saved._id.toString(),
      name: saved.name,
      email: saved.email,
      role: saved.role,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
