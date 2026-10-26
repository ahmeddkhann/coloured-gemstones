import { z } from "zod";

import { GEMSTONE_TYPES, ORDER_STATUSES } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  password: z.union([
    z.string().min(8, "Password must be at least 8 characters."),
    z.literal(""),
  ]).optional(),
});

export const otpVerifySchema = z.object({
  email: z.string().email("Enter a valid email."),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const otpResendSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

const gemstoneImageSchema = z.object({
  url: z.string().url("Image URL is invalid."),
  publicId: z.string().min(1, "Image publicId is required."),
});

export const createGemstoneSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(GEMSTONE_TYPES),
  color: z.string().min(1, "Colour is required."),
  cut: z.string().min(1, "Cut is required."),
  clarity: z.string().min(1, "Clarity is required."),
  origin: z.string().min(1, "Origin is required."),
  carat: z.number().nonnegative(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  images: z
    .array(gemstoneImageSchema)
    .min(1, "Add at least one image.")
    .max(5, "A gemstone can have at most 5 images."),
  featured: z.boolean().default(false),
});

export const updateGemstoneSchema = createGemstoneSchema.partial().extend({
  images: z
    .array(gemstoneImageSchema)
    .min(1, "Add at least one image.")
    .max(5, "A gemstone can have at most 5 images.")
    .optional(),
});

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Name is required."),
    email: z.string().email("Enter a valid email."),
    phone: z.string().min(5, "Phone is required."),
    address: z.string().min(1, "Address is required."),
    notes: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        gemstoneId: z.string().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "Add at least one item."),
});

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().optional(),
});

export const recommendationsSchema = z.object({
  slug: z.string().min(1, "Slug is required."),
});
