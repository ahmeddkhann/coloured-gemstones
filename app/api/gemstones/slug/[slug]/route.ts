import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { serializeDoc } from "@/lib/serialize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    await connectDB();
    const gemstone = await GemstoneModel.findOne({ slug });
    if (!gemstone) {
      return jsonError("Gemstone not found.", 404);
    }

    return jsonOk(serializeDoc(gemstone));
  } catch (error) {
    return handleRouteError(error);
  }
}
