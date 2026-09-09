import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.userId },
      include: {
        platform: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Subscriptions GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platformId, isActive } = body;

    if (!platformId) {
      return NextResponse.json({ error: 'PlatformId is required' }, { status: 400 });
    }

    const platform = await prisma.streamingPlatform.findUnique({ where: { id: platformId } });
    if (!platform || platform.userId !== session.userId) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    const existing = await prisma.subscription.findFirst({
      where: { userId: session.userId, platformId }
    });

    if (existing) {
      const updated = await prisma.subscription.update({
        where: { id: existing.id },
        data: { isActive }
      });
      return NextResponse.json(updated);
    } else {
      const sub = await prisma.subscription.create({
        data: {
          userId: session.userId,
          platformId,
          isActive: isActive !== undefined ? isActive : true
        }
      });
      return NextResponse.json(sub);
    }
  } catch (error) {
    console.error('Subscriptions POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
