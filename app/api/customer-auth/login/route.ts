import bcrypt from "bcryptjs";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import {
  setCustomerCookie,
  signCustomerToken,
} from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { customerSigninSchema } from "@/lib/validations";

const DUMMY_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8xkqHq1nR3mGq0cYkOQb5mYk5mYk5m";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = customerSigninSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();

    const email = parsed.data.email.toLowerCase();
    const customer = await CustomerModel.findOne({ email }).select(
      "+passwordHash",
    );

    const hash = customer?.passwordHash ?? DUMMY_HASH;
    const passwordOk = await bcrypt.compare(parsed.data.password, hash);

    if (!customer || !passwordOk) {
      return jsonError("Invalid email or password.", 401);
    }

    const token = await signCustomerToken({
      customerId: String(customer._id),
      email: customer.email,
      role: "customer",
    });
    await setCustomerCookie(token);

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
