import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import {
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_RESET_COOKIE_NAME,
  CUSTOMER_SIGNUP_COOKIE_NAME,
} from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";

export type CustomerSession = {
  customerId: string;
  email: string;
  role: "customer";
};

export type PendingSignupPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  passwordHash: string;
  purpose: "signup";
};

const DEV_SESSION_SECRET =
  "coloured-gemstones-dev-session-secret-change-me";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set and at least 32 characters.",
    );
  }

  console.warn(
    "ADMIN_SESSION_SECRET is missing or shorter than 32 characters. Using a local development secret. Add a long value to .env.local.",
  );
  return new TextEncoder().encode(DEV_SESSION_SECRET);
}

export async function signCustomerToken(session: CustomerSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyCustomerToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());

  if (
    typeof payload.customerId !== "string" ||
    typeof payload.email !== "string" ||
    payload.role !== "customer"
  ) {
    return null;
  }

  return {
    customerId: payload.customerId,
    email: payload.email,
    role: "customer" as const,
  };
}

export async function setCustomerCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearCustomerCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_COOKIE_NAME);
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await verifyCustomerToken(token);
    if (!session) {
      return null;
    }

    await connectDB();
    const customer = await CustomerModel.findById(session.customerId);
    if (!customer) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function signCustomerResetToken(email: string) {
  return new SignJWT({ email, purpose: "customer-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function setCustomerResetCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_RESET_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function clearCustomerResetCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_RESET_COOKIE_NAME);
}

export async function getCustomerResetEmail() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_RESET_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.purpose !== "customer-reset" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

export async function verifyCustomerResetToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.purpose !== "customer-reset" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

export async function signPendingSignupToken(payload: PendingSignupPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function setPendingSignupCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SIGNUP_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function clearPendingSignupCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SIGNUP_COOKIE_NAME);
}

export async function getPendingSignup(): Promise<PendingSignupPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SIGNUP_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.purpose !== "signup" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.phone !== "string" ||
      typeof payload.address !== "string" ||
      typeof payload.passwordHash !== "string"
    ) {
      return null;
    }

    return {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      passwordHash: payload.passwordHash,
      purpose: "signup",
    };
  } catch {
    return null;
  }
}
