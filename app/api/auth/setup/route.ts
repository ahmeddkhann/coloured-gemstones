import { handleRouteError, jsonOk } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";

export async function GET() {
  try {
    await connectDB();
    const count = await AdminModel.countDocuments();
    return jsonOk({ hasAdmin: count > 0 });
  } catch (error) {
    return handleRouteError(error);
  }
}
