export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const GEMSTONE_TYPES = [
  "sapphire",
  "ruby",
  "emerald",
  "tourmaline",
  "garnet",
  "topaz",
  "tanzanite",
  "other",
] as const;

export type GemstoneType = (typeof GEMSTONE_TYPES)[number];

export const PAYMENT_METHODS = ["cod"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ADMIN_ROLES = ["admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
