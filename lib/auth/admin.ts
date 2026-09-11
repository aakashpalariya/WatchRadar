import { NextRequest, NextResponse } from "next/server";
import { getIronSession, SessionOptions } from "iron-session";

export interface AdminSessionData {
  isAdmin?: boolean;
  authenticatedAt?: number;
}

export const adminSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "watchradar-super-secret-session-key-change-in-production-2024",
  cookieName: "watchradar-admin-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours for admin session
    httpOnly: true,
    sameSite: "lax",
  },
};

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export function verifyAdminPassword(inputPassword: string): boolean {
  const actualPassword = getAdminPassword();
  return inputPassword === actualPassword;
}

export async function getAdminSession(req: NextRequest, res?: NextResponse) {
  const response = res || NextResponse.next();
  return getIronSession<AdminSessionData>(req, response, adminSessionOptions);
}

export async function checkIsAdmin(req: NextRequest): Promise<boolean> {
  try {
    const res = NextResponse.next();
    const session = await getIronSession<AdminSessionData>(req, res, adminSessionOptions);
    return Boolean(session.isAdmin);
  } catch (err) {
    console.error("Failed to verify admin session:", err);
    return false;
  }
}
