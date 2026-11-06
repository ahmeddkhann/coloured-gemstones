import { handleRouteError, jsonOk } from "@/lib/api";
import { clearCustomerCookie } from "@/lib/customer-auth";

export async function POST() {
  try {
    await clearCustomerCookie();
    return jsonOk({ message: "Signed out." });
  } catch (error) {
    return handleRouteError(error);
  }
}
