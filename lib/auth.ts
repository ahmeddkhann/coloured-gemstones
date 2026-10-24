import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, RESET_COOKIE_NAME } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";

export type AdminSession = {
  adminId: string;
  email: string;
  role: "admin";
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

export async function signAdminToken(session: AdminSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());

  if (
    typeof payload.adminId !== "string" ||
    typeof payload.email !== "string" ||
    payload.role !== "admin"
  ) {
    return null;
  }

  return {
    adminId: payload.adminId,
    email: payload.email,
    role: "admin" as const,
  };
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function signResetToken(email: string) {
  return new SignJWT({ email, purpose: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function setResetCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(RESET_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function clearResetCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(RESET_COOKIE_NAME);
}

export async function getResetEmail() {
  const cookieStore = await cookies();
  const token = cookieStore.get(RESET_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "reset" || typeof payload.email !== "string") {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await verifyAdminToken(token);
    if (!session) {
      return null;
    }

    await connectDB();
    const admin = await AdminModel.findById(session.adminId);
    if (!admin) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
