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

const gemstoneMediaSchema = z.object({
  url: z.string().url("Media URL is invalid."),
  publicId: z.string().min(1, "Media publicId is required."),
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
    .array(gemstoneMediaSchema)
    .min(1, "Add at least one image.")
    .max(5, "A gemstone can have at most 5 images."),
  videos: z
    .array(gemstoneMediaSchema)
    .max(3, "A gemstone can have at most 3 videos.")
    .default([]),
  featured: z.boolean().default(false),
});

export const updateGemstoneSchema = createGemstoneSchema.partial().extend({
  images: z
    .array(gemstoneMediaSchema)
    .min(1, "Add at least one image.")
    .max(5, "A gemstone can have at most 5 images.")
    .optional(),
  videos: z
    .array(gemstoneMediaSchema)
    .max(3, "A gemstone can have at most 3 videos.")
    .optional(),
});

export const uploadSignSchema = z.object({
  resourceType: z.enum(["image", "video"]),
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

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, "Send at least one message.")
    .max(24, "Conversation is too long."),
});

export const gemstonePreferenceSchema = z.object({
  types: z.array(z.string().trim().min(1)).max(8),
  colours: z.array(z.string().trim().min(1)).max(8),
  budget: z.enum(["any", "under-1k", "1k-5k", "5k-25k", "25k-plus"]),
  occasion: z.enum([
    "any",
    "engagement",
    "gift",
    "collection",
    "everyday",
    "investment",
  ]),
  caratFeel: z.enum(["any", "delicate", "medium", "statement"]),
  notes: z.string().trim().max(500).optional(),
});

export const chatRecommendSchema = z.object({
  preferences: gemstonePreferenceSchema,
  messages: z.array(chatMessageSchema).max(12).optional(),
});
