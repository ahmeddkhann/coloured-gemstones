import { isValidObjectId } from "mongoose";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { destroyImages } from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { requireAdmin } from "@/lib/require-admin";
import { serializeDoc } from "@/lib/serialize";
import { uniqueGemstoneSlug } from "@/lib/slug";
import { updateGemstoneSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return jsonError("Gemstone not found.", 404);
    }

    await connectDB();
    const gemstone = await GemstoneModel.findById(id);
    if (!gemstone) {
      return jsonError("Gemstone not found.", 404);
    }

    return jsonOk(serializeDoc(gemstone));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return jsonError("Gemstone not found.", 404);
    }

    const body = await readJson(request);
    const parsed = updateGemstoneSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();
    const gemstone = await GemstoneModel.findById(id);
    if (!gemstone) {
      return jsonError("Gemstone not found.", 404);
    }

    const updates = { ...parsed.data };
    if (updates.name && updates.name !== gemstone.name) {
      gemstone.slug = await uniqueGemstoneSlug(updates.name, id);
    }

    if (updates.images) {
      const nextIds = new Set(updates.images.map((image) => image.publicId));
      const removed = gemstone.images
        .map((image: { publicId: string }) => image.publicId)
        .filter((publicId: string) => !nextIds.has(publicId));
      if (removed.length > 0) {
        await destroyImages(removed);
      }
    }

    Object.assign(gemstone, updates);
    await gemstone.save();
    return jsonOk(serializeDoc(gemstone));
  } catch (error) {
    return handleRouteError(error);
  }
}

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
      return jsonError("Gemstone not found.", 404);
    }

    await connectDB();
    const gemstone = await GemstoneModel.findByIdAndDelete(id);
    if (!gemstone) {
      return jsonError("Gemstone not found.", 404);
    }

    await destroyImages(
      gemstone.images.map((image: { publicId: string }) => image.publicId),
    );
    return jsonOk({ id });
  } catch (error) {
    return handleRouteError(error);
  }
}
