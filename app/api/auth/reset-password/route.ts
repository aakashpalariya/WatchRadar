import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const VerifySchema = z.object({
  action: z.literal("verify"),
  email: z.string().email(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ResetSchema = z.object({
  action: z.literal("reset"),
  email: z.string().email(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const Schema = z.discriminatedUnion("action", [VerifySchema, ResetSchema]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Always return same error to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { error: "Email or date of birth does not match our records" },
        { status: 401 }
      );
    }

    // Verify DOB
    const dobMatch = await bcrypt.compare(data.dob, user.dobHash);
    if (!dobMatch) {
      return NextResponse.json(
        { error: "Email or date of birth does not match our records" },
        { status: 401 }
      );
    }

    if (data.action === "verify") {
      // Just confirm identity — client will proceed to new password step
      return NextResponse.json({ verified: true });
    }

    // Reset password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
