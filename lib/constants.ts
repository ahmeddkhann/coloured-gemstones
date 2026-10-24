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

export const OTP_PURPOSES = ["login", "reset"] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const ADMIN_COOKIE_NAME = "cg_admin";
export const RESET_COOKIE_NAME = "cg_reset";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
