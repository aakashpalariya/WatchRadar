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

    const collections = await prisma.collection.findMany({
      where: { userId: session.userId },
      include: {
        media: {
          select: {
            mediaId: true,
            media: { select: { posterPath: true } }
          }
        },
        _count: {
          select: { media: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const result = collections.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.createdAt,
      itemCount: c._count.media,
      mediaIds: c.media.map(m => m.mediaId),
      posters: c.media.map(m => m.media.posterPath).filter(Boolean)
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Collections GET error:', error);
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId: session.userId
      }
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Collections POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
