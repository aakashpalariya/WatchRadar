import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: mediaId } = await params;
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { seasons: { include: { episodes: true } } }
    });
    
    if (!media || media.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { seasonNumber, episodeNumber, isWatched } = body;

    const season = media.seasons.find(s => s.seasonNumber === seasonNumber);
    if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 });

    const episode = season.episodes.find(e => e.episodeNumber === episodeNumber);
    if (!episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404 });

    const watchedAt = isWatched ? new Date() : null;

    await prisma.episode.update({
      where: { id: episode.id },
      data: { isWatched, watchedAt }
    });

    const allEpisodesCount = await prisma.episode.count({
      where: { season: { mediaId } }
    });
    const watchedCount = await prisma.episode.count({
      where: { season: { mediaId }, isWatched: true }
    });

    const progressPercentage = allEpisodesCount > 0 
      ? Math.round((watchedCount / allEpisodesCount) * 100) 
      : 0;

    let status = media.status;
    let mediaWatchedAt = media.watchedAt;

    if (watchedCount === allEpisodesCount && allEpisodesCount > 0) {
      status = 'WATCHED';
      mediaWatchedAt = new Date();
    } else if (watchedCount > 0 && status === 'WANT_TO_WATCH') {
      status = 'WATCHING';
    } else if (watchedCount < allEpisodesCount && status === 'WATCHED') {
      status = 'WATCHING';
      mediaWatchedAt = null;
    }

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        watchedEpisodes: watchedCount,
        progressPercentage,
        status,
        watchedAt: mediaWatchedAt,
        currentSeason: seasonNumber,
        currentEpisode: episodeNumber
      }
    });

    if (isWatched) {
      await prisma.watchHistory.create({
        data: {
          userId: session.userId,
          mediaId: mediaId,
          episodeId: episode.id,
          watchedAt: new Date()
        }
      });
    } else {
      await prisma.watchHistory.deleteMany({
        where: {
          userId: session.userId,
          mediaId: mediaId,
          episodeId: episode.id
        }
      });
    }

    return NextResponse.json({
      watchedEpisodes: watchedCount,
      progressPercentage,
      status
    });
  } catch (error) {
    console.error('Media episode PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
