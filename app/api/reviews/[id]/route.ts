import { isValidObjectId } from "mongoose";

import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { ReviewModel } from "@/lib/models/Review";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return jsonError("Review not found.", 404);
    }

    await connectDB();
    const deleted = await ReviewModel.findByIdAndDelete(id);
    if (!deleted) {
      return jsonError("Review not found.", 404);
    }

    return jsonOk({ message: "Review removed." });
  } catch (error) {
    return handleRouteError(error);
  }
}
