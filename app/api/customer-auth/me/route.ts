import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return jsonError("Unauthorized.", 401);
    }

    await connectDB();
    const customer = await CustomerModel.findById(session.customerId).lean();
    if (!customer) {
      return jsonError("Unauthorized.", 401);
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
