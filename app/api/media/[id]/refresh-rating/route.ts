import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { fetchIMDbRating } from '@/lib/services/imdb';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: mediaId } = await params;
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    
    if (!media || media.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!media.imdbId) {
      return NextResponse.json({ error: 'No IMDb ID available' }, { status: 400 });
    }

    const ratingInfo = await fetchIMDbRating(media.imdbId);
    
    if (!ratingInfo) {
      return NextResponse.json({ error: 'Failed to fetch rating' }, { status: 500 });
    }

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        imdbRating: ratingInfo.imdbRating,
        imdbVoteCount: ratingInfo.imdbVoteCount,
        imdbRatingUpdatedAt: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Media refresh rating error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
