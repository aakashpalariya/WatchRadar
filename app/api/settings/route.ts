import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user, totalMedia, totalFavorites] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          appSettings: true
        }
      }),
      prisma.media.count({ where: { userId: session.userId } }),
      prisma.media.count({ where: { userId: session.userId, isFavorite: true } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name || 'WatchRadar User',
      email: user.email,
      createdAt: user.createdAt,
      totalMedia,
      totalFavorites,
      theme: user.appSettings?.theme || 'dark',
      defaultView: user.appSettings?.defaultView || 'grid',
      defaultSort: user.appSettings?.defaultSort || 'createdAt_desc',
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { theme, defaultView, defaultSort, name, currentPassword, newPassword } = body;

    if (name !== undefined) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { name }
      });
      session.name = name;
      await session.save();
    }

    if (theme !== undefined || defaultView !== undefined || defaultSort !== undefined) {
      await prisma.appSettings.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          theme: theme || 'dark',
          defaultView: defaultView || 'grid',
          defaultSort: defaultSort || 'createdAt_desc',
        },
        update: {
          ...(theme !== undefined && { theme }),
          ...(defaultView !== undefined && { defaultView }),
          ...(defaultSort !== undefined && { defaultSort }),
        }
      });
    }

    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid current password' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
