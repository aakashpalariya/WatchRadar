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

    const userId = session.userId;

    const [
      allMedia,
      genres,
      platforms,
      history,
      recentActivity
    ] = await Promise.all([
      prisma.media.findMany({ where: { userId } }),
      prisma.mediaGenre.findMany({ where: { media: { userId } }, include: { genre: true } }),
      prisma.mediaStreamingPlatform.findMany({ where: { media: { userId } }, include: { platform: true } }),
      prisma.watchHistory.findMany({ 
        where: { userId, watchedAt: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } },
        include: { media: true }
      }),
      prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        take: 10,
        include: { media: { select: { title: true, type: true, posterPath: true } } }
      })
    ]);

    let totalMovies = 0, totalSeries = 0, watchedMovies = 0, watchedSeries = 0;
    let currentlyWatching = 0, wantToWatch = 0, totalEpisodesWatched = 0;
    let sumMovieRuntime = 0, sumEpisodeRuntime = 0;
    let sumImdbRating = 0, countImdbRating = 0;
    let sumMyRating = 0, countMyRating = 0;

    allMedia.forEach(m => {
      if (m.type === 'MOVIE') {
        totalMovies++;
        if (m.status === 'WATCHED') {
          watchedMovies++;
          sumMovieRuntime += m.runtime || 0;
        }
      } else {
        totalSeries++;
        if (m.status === 'WATCHED') watchedSeries++;
        totalEpisodesWatched += m.watchedEpisodes || 0;
        sumEpisodeRuntime += (m.watchedEpisodes || 0) * (m.runtime || 45); // default 45 mins
      }

      if (m.status === 'WATCHING') currentlyWatching++;
      if (m.status === 'WANT_TO_WATCH') wantToWatch++;

      if (m.status === 'WATCHED' && m.imdbRating) {
        sumImdbRating += m.imdbRating;
        countImdbRating++;
      }
      if (m.myRating) {
        sumMyRating += m.myRating;
        countMyRating++;
      }
    });

    const estimatedHoursWatched = Math.round((sumMovieRuntime + sumEpisodeRuntime) / 60);
    const avgImdbRating = countImdbRating > 0 ? (sumImdbRating / countImdbRating).toFixed(1) : 0;
    const avgMyRating = countMyRating > 0 ? (sumMyRating / countMyRating).toFixed(1) : 0;

    const genreCount: any = {};
    genres.forEach(g => {
      genreCount[g.genre.name] = (genreCount[g.genre.name] || 0) + 1;
    });
    const genreDistribution = Object.entries(genreCount).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count);

    const platformCount: any = {};
    platforms.forEach(p => {
      platformCount[p.platform.name] = (platformCount[p.platform.name] || 0) + 1;
    });
    const platformDistribution = Object.entries(platformCount).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count);

    const monthlyData: any = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { month: monthKey, movies: 0, series: 0 };
    }

    history.forEach(h => {
      const monthKey = h.watchedAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyData[monthKey]) {
        if (h.media.type === 'MOVIE') monthlyData[monthKey].movies++;
        else monthlyData[monthKey].series++; // Count episode watched
      }
    });
    
    const monthlyWatched = Object.values(monthlyData);

    return NextResponse.json({
      totalMovies,
      totalSeries,
      watchedMovies,
      watchedSeries,
      currentlyWatching,
      wantToWatch,
      totalEpisodesWatched,
      estimatedHoursWatched,
      avgImdbRating,
      avgMyRating,
      genreDistribution,
      platformDistribution,
      monthlyWatched,
      recentActivity
    });
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
