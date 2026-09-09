import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: mediaId } = await params;
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        genres: { include: { genre: true } },
        languages: { include: { language: true } },
        platforms: { include: { platform: true } },
        mediaTags: { include: { tag: true } },
        collections: { include: { collection: true } },
        seasons: {
          orderBy: { seasonNumber: 'asc' },
          include: {
            episodes: {
              orderBy: { episodeNumber: 'asc' }
            }
          }
        },
        watchHistory: {
          orderBy: { watchedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!media || media.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error('Media [id] GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: mediaId } = await params;
    const existing = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, status, myRating, myReview, isFavorite, notes, platformIds, tagIds } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (status !== undefined) {
      data.status = status;
      if (status === 'WATCHED') {
        data.progressPercentage = 100;
        data.watchedAt = new Date();
        if (existing.type === 'MOVIE') {
          data.watchedEpisodes = 1;
        } else {
          if (existing.totalEpisodes) {
            data.watchedEpisodes = existing.totalEpisodes;
            data.currentEpisode = existing.totalEpisodes;
          }
        }
      } else if (status === 'WANT_TO_WATCH') {
        data.progressPercentage = 0;
        data.watchedEpisodes = 0;
        data.currentEpisode = 0;
        data.currentSeason = 1;
      } else if (status === 'WATCHING') {
        if (existing.type === 'MOVIE') {
          if (!existing.progressPercentage || existing.progressPercentage === 0 || existing.progressPercentage === 100) {
            data.progressPercentage = 25;
          }
        } else if (existing.progressPercentage === 0 || !existing.progressPercentage) {
          data.currentSeason = 1;
          data.currentEpisode = 1;
          data.progressPercentage = existing.totalEpisodes ? Math.round((1 / existing.totalEpisodes) * 100) : 10;
        }
      }
    }
    if (myRating !== undefined) data.myRating = myRating;
    if (myReview !== undefined) data.myReview = myReview;
    if (isFavorite !== undefined) data.isFavorite = isFavorite;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data
    });

    if (platformIds) {
      await prisma.mediaStreamingPlatform.deleteMany({ where: { mediaId } });
      await prisma.mediaStreamingPlatform.createMany({
        data: platformIds.map((pid: string) => ({ mediaId, platformId: pid }))
      });
    }

    if (tagIds) {
      await prisma.mediaTag.deleteMany({ where: { mediaId } });
      await prisma.mediaTag.createMany({
        data: tagIds.map((tid: string) => ({ mediaId, tagId: tid }))
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Media [id] PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: mediaId } = await params;
    const existing = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.media.delete({ where: { id: mediaId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media [id] DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
