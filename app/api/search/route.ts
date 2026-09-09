import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { searchTMDB } from '@/lib/services/tmdb';

const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');

    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const tmdbData = await searchTMDB(q, page);
    const tmdbResults = tmdbData.results || [];
    
    const filteredResults = tmdbResults.filter(
      (r: any) => r.media_type === 'movie' || r.media_type === 'tv'
    );

    const tmdbIds = filteredResults.map((r: any) => r.id);
    
    const existingMedia = await prisma.media.findMany({
      where: {
        userId: session.userId,
        tmdbId: { in: tmdbIds }
      },
      select: { tmdbId: true }
    });
    
    const existingIds = new Set(existingMedia.map(m => m.tmdbId).filter(Boolean));

    const onlineResults = filteredResults.map((r: any) => ({
      id: r.id,
      tmdbId: r.id,
      title: r.title || r.name,
      type: r.media_type === 'movie' ? 'MOVIE' : 'SERIES',
      year: (r.release_date || r.first_air_date)?.substring(0, 4) || '',
      overview: r.overview,
      posterPath: r.poster_path,
      backdropPath: r.backdrop_path,
      imdbRating: r.vote_average ? Number(r.vote_average.toFixed(1)) : null,
      genres: r.genre_ids?.map((id: number) => TMDB_GENRES[id] || id.toString()) || [],
      alreadyInLibrary: existingIds.has(r.id)
    }));

    // Fetch all user media for case-insensitive search
    const allUserMedia = await prisma.media.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' }
    });

    const libraryResults = allUserMedia.filter(m =>
      m.title.toLowerCase().includes(q.toLowerCase())
    );

    return NextResponse.json({
      onlineResults,
      libraryResults
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
