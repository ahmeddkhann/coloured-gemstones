import "server-only";

import { jsonError } from "@/lib/api";
import {
  getCustomerSession,
  type CustomerSession,
} from "@/lib/customer-auth";

export async function requireCustomer(): Promise<
  | { customer: CustomerSession; error?: undefined }
  | { customer?: undefined; error: Response }
> {
  const customer = await getCustomerSession();

  if (!customer) {
    return { error: jsonError("Unauthorized.", 401) };
  }

  return { customer };
}
