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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const mediaId = searchParams.get('mediaId');

    const where: any = { userId: session.userId };
    if (mediaId) {
      where.mediaId = mediaId;
    }

    const skip = (page - 1) * limit;

    const [total, history] = await Promise.all([
      prisma.watchHistory.count({ where }),
      prisma.watchHistory.findMany({
        where,
        orderBy: { watchedAt: 'desc' },
        skip,
        take: limit,
        include: {
          media: {
            select: {
              title: true,
              type: true,
              posterPath: true
            }
          }
        }
      })
    ]);

    // Grouping could be done on frontend or backend. Doing simple return here as requested by pagination limits grouping simply.
    // If strict grouping by date is required:
    const grouped = history.reduce((acc: any, curr) => {
      const date = curr.watchedAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {});

    return NextResponse.json({
      data: Object.keys(grouped).map(date => ({
        date,
        entries: grouped[date]
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Watch History GET error:', error);
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
    const { mediaId, episodeId } = body;

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    let seasonNumber, episodeNumber;

    if (episodeId) {
      const ep = await prisma.episode.findUnique({
        where: { id: episodeId },
        include: { season: true }
      });
      if (ep) {
        seasonNumber = ep.season.seasonNumber;
        episodeNumber = ep.episodeNumber;
      }
    }

    const entry = await prisma.watchHistory.create({
      data: {
        userId: session.userId,
        mediaId,
        episodeId,
        watchedAt: new Date()
      }
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Watch History POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
