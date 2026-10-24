import "server-only";

import { jsonError } from "@/lib/api";
import { getAdminSession, type AdminSession } from "@/lib/auth";

export async function requireAdmin(): Promise<
  { admin: AdminSession; error?: undefined } | { admin?: undefined; error: Response }
> {
  const admin = await getAdminSession();

  if (!admin) {
    return { error: jsonError("Unauthorized.", 401) };
  }

  return { admin };
}
