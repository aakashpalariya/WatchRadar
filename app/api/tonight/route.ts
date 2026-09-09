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
    const maxRuntime = parseInt(searchParams.get('maxRuntime') || '999');
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
    const type = searchParams.get('type') || 'EITHER';
    const platformId = searchParams.get('platformId') || 'any';
    const count = parseInt(searchParams.get('count') || '5');

    let where: any = {
      userId: session.userId,
      status: { in: ['WANT_TO_WATCH', 'WATCHING'] }
    };

    if (type !== 'EITHER') {
      where.type = type;
    }

    if (maxRuntime < 999) {
      where.OR = [
        { runtime: { lte: maxRuntime } },
        { runtime: null } // allow nulls if they don't know
      ];
    }

    if (genres.length > 0) {
      where.genres = {
        some: {
          genre: { name: { in: genres } }
        }
      };
    }

    if (platformId === 'subscriptions') {
      const subs = await prisma.subscription.findMany({
        where: { userId: session.userId, isActive: true },
        select: { platformId: true }
      });
      const subPlatformIds = subs.map(s => s.platformId);
      if (subPlatformIds.length > 0) {
        where.platforms = {
          some: { platformId: { in: subPlatformIds } }
        };
      }
    } else if (platformId !== 'any') {
      where.platforms = {
        some: { platformId }
      };
    }

    const items = await prisma.media.findMany({
      where,
      include: {
        genres: { include: { genre: true } },
        platforms: { include: { platform: true } }
      }
    });

    const scoredItems = items.map(item => {
      const imdbRating = item.imdbRating || 0;
      const isFavScore = item.isFavorite ? 3 : 0;
      const myRating = item.myRating || 0;
      const randomScore = Math.random() * 0.5;
      
      const score = (imdbRating * 2) + isFavScore + myRating + randomScore;
      
      return { ...item, _score: score };
    });

    scoredItems.sort((a, b) => b._score - a._score);
    const topResults = scoredItems.slice(0, Math.max(10, count));
    
    let pickForMe = null;
    if (topResults.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(topResults.length, 10));
      pickForMe = topResults[randomIndex];
    }

    return NextResponse.json({
      results: topResults.slice(0, count).map(i => {
        const { _score, ...rest } = i;
        return rest;
      }),
      pickForMe: pickForMe ? (() => { const { _score, ...rest } = pickForMe; return rest; })() : null
    });
  } catch (error) {
    console.error('Tonight GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
