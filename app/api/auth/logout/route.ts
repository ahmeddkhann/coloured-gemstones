import { handleRouteError, jsonOk } from "@/lib/api";
import { clearAdminCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAdminCookie();
    return jsonOk({ message: "Signed out." });
  } catch (error) {
    return handleRouteError(error);
  }
}
