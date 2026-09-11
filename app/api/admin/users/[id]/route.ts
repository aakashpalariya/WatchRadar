import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, ensureDatabaseReady } from "@/lib/db/prisma";
import { checkIsAdmin } from "@/lib/auth/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    await ensureDatabaseReady(prisma);

    const user = (await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        dobHash: true,
        dob: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        collections: {
          select: { id: true, name: true, _count: { select: { media: true } } },
        },
        tags: {
          select: { id: true, name: true, color: true },
        },
        media: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            posterPath: true,
            myRating: true,
            progressPercentage: true,
            watchedAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        },
        watchHistory: {
          select: {
            id: true,
            watchedAt: true,
            notes: true,
            media: {
              select: { title: true, type: true, posterPath: true },
            },
          },
          orderBy: { watchedAt: "desc" },
          take: 10,
        },
      },
    })) as any;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: { ...user, dob: user.dob || null, hasDob: Boolean(user.dobHash || user.dob) } });
  } catch (err: any) {
    console.error("Admin Get User Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch user details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    await ensureDatabaseReady(prisma);

    const body = await req.json();
    const { name, email, password, isActive, dob } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name.trim();
    if (dob !== undefined) {
      const trimmedDob = typeof dob === "string" ? dob.trim() : "";
      updateData.dob = trimmedDob || null;
      if (trimmedDob && /^\d{4}-\d{2}-\d{2}$/.test(trimmedDob)) {
        updateData.dobHash = await bcrypt.hash(trimmedDob, 10);
      }
    }
    if (email && email.trim() !== existingUser.email) {
      // Check duplicate email
      const emailTaken = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (emailTaken) {
        return NextResponse.json({ error: "Email is already in use by another user" }, { status: 400 });
      }
      updateData.email = email.trim();
    }

    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        dob: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error("Admin Update User Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    await ensureDatabaseReady(prisma);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    console.error("Admin Delete User Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete user" }, { status: 500 });
  }
}
