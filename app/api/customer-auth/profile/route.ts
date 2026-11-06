import bcrypt from "bcryptjs";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { requireCustomer } from "@/lib/require-customer";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { customerProfileUpdateSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  try {
    const auth = await requireCustomer();
    if (auth.error) {
      return auth.error;
    }

    const body = await readJson(request);
    const parsed = customerProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();
    const updates: Record<string, string> = {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      address: parsed.data.address.trim(),
    };

    if (parsed.data.password) {
      updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    }

    const customer = await CustomerModel.findByIdAndUpdate(
      auth.customer.customerId,
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!customer) {
      return jsonError("Account not found.", 404);
    }

    return jsonOk({
      id: String(customer._id),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
