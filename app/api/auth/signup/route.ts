import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sessionOptions, SessionData } from "@/lib/auth/session";

const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(60),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .refine((v) => {
      const d = new Date(v);
      const now = new Date();
      return d < now && d.getFullYear() > 1900;
    }, "Invalid date of birth"),
});

const DEFAULT_PLATFORMS = [
  { name: "Netflix", color: "#E50914" },
  { name: "Prime Video", color: "#00A8E1" },
  { name: "JioHotstar", color: "#1F80E0" },
  { name: "Sony LIV", color: "#1A1A8C" },
  { name: "ZEE5", color: "#8B2FC9" },
  { name: "Apple TV+", color: "#555555" },
  { name: "YouTube", color: "#FF0000" },
  { name: "JioCinema", color: "#FF6B35" },
  { name: "Other", color: "#6B7280" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, dob } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and DOB
    const passwordHash = await bcrypt.hash(password, 12);
    const dobHash = await bcrypt.hash(dob, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        dobHash,
        name,
        appSettings: {
          create: {
            theme: "dark",
            defaultView: "grid",
            defaultSort: "createdAt_desc",
          },
        },
      },
    });

    // Seed default streaming platforms for the user
    for (const platform of DEFAULT_PLATFORMS) {
      await prisma.streamingPlatform.create({
        data: {
          userId: user.id,
          name: platform.name,
          color: platform.color,
          isDefault: true,
        },
      });
    }

    // Create session
    const res = NextResponse.json({ success: true, userId: user.id });
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name ?? undefined;
    await session.save();

    return res;
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

