import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
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
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    
    if (!media || media.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    let currentSeason = media.currentSeason;
    let currentEpisode = media.currentEpisode;
    let watchedEpisodes = media.watchedEpisodes;
    let progressPercentage = media.progressPercentage || 0;

    if (body.progressPercentage !== undefined) {
      progressPercentage = Math.min(100, Math.max(0, Number(body.progressPercentage)));
      if (media.type === 'MOVIE') {
        watchedEpisodes = progressPercentage >= 100 ? 1 : 0;
      }
    } else if (body.currentSeason !== undefined && body.currentEpisode !== undefined) {
      currentSeason = body.currentSeason;
      currentEpisode = body.currentEpisode;
    } else if (body.watchedEpisodes !== undefined) {
      watchedEpisodes = body.watchedEpisodes;
      const totalEps = media.totalEpisodes || 1;
      progressPercentage = Math.min(100, Math.max(0, Math.round((watchedEpisodes / totalEps) * 100)));
    }

    let status = media.status;
    let watchedAt = media.watchedAt;
    
    if (progressPercentage >= 100) {
      status = 'WATCHED';
      progressPercentage = 100;
      watchedAt = body.watchedAt ? new Date(body.watchedAt) : (media.watchedAt || new Date());
      if (media.type === 'SERIES') {
        await prisma.episode.updateMany({
          where: { season: { mediaId } },
          data: { isWatched: true, watchedAt: watchedAt }
        }).catch(() => {});
      }
    } else if (progressPercentage > 0) {
      status = 'WATCHING';
      watchedAt = null;
    } else if (progressPercentage === 0) {
      status = 'WANT_TO_WATCH';
      watchedAt = null;
    }

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        currentSeason,
        currentEpisode,
        watchedEpisodes,
        progressPercentage,
        status,
        watchedAt
      }
    });

    await prisma.watchHistory.create({
      data: {
        userId: session.userId,
        mediaId: mediaId,
        watchedAt: new Date()
      }
    });

    try {
      revalidatePath(`/library/${mediaId}`);
      revalidatePath('/library');
      revalidatePath('/stats');
      revalidatePath('/favorites');
      revalidatePath('/history');
    } catch {}

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Media progress PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
