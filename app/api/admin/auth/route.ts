import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { adminSessionOptions, AdminSessionData, verifyAdminPassword } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  try {
    const res = NextResponse.json({ success: true });
    const session = await getIronSession<AdminSessionData>(req, res, adminSessionOptions);

    if (session.isAdmin) {
      return NextResponse.json({ isAuthenticated: true, authenticatedAt: session.authenticatedAt });
    }

    return NextResponse.json({ isAuthenticated: false });
  } catch (err: any) {
    return NextResponse.json({ isAuthenticated: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, message: "Admin authenticated successfully" });
    const session = await getIronSession<AdminSessionData>(req, res, adminSessionOptions);
    session.isAdmin = true;
    session.authenticatedAt = Date.now();
    await session.save();

    return res;
  } catch (err: any) {
    console.error("Admin Auth Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to authenticate" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const res = NextResponse.json({ success: true, message: "Admin logged out" });
    const session = await getIronSession<AdminSessionData>(req, res, adminSessionOptions);
    session.destroy();
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to logout" }, { status: 500 });
  }
}
