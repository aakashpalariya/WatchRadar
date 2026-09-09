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

    let platforms = await prisma.streamingPlatform.findMany({
      where: { userId: session.userId },
      include: {
        subscriptions: true
      },
      orderBy: { name: 'asc' }
    });

    if (platforms.length === 0) {
      const defaultPlatforms = [
        { name: 'Netflix', color: '#E50914' },
        { name: 'Prime Video', color: '#00A8E1' },
        { name: 'Disney+ Hotstar', color: '#113CCF' },
        { name: 'Apple TV+', color: '#A3A3A3' },
        { name: 'SonyLIV', color: '#F97316' },
        { name: 'Zee5', color: '#8B5CF6' },
        { name: 'JioCinema', color: '#EC4899' },
      ];

      for (const p of defaultPlatforms) {
        await prisma.streamingPlatform.create({
          data: {
            userId: session.userId,
            name: p.name,
            color: p.color,
            isDefault: true,
          }
        }).catch(() => {});
      }

      platforms = await prisma.streamingPlatform.findMany({
        where: { userId: session.userId },
        include: { subscriptions: true },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json(platforms);
  } catch (error) {
    console.error('Platforms GET error:', error);
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
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const platform = await prisma.streamingPlatform.create({
      data: {
        name,
        color,
        userId: session.userId
      }
    });

    return NextResponse.json(platform);
  } catch (error) {
    console.error('Platforms POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
