import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { fetchMovieDetails, fetchTVDetails } from '@/lib/services/tmdb';
import { fetchIMDbRating } from '@/lib/services/imdb';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tmdbIdParam = searchParams.get('tmdbId');
    const type = searchParams.get('type') || 'MOVIE';

    const tmdbId = Number(tmdbIdParam);
    if (!tmdbId) {
      return NextResponse.json({ error: 'Valid tmdbId is required' }, { status: 400 });
    }

    let title = '';
    let year = '';
    let runtime: number | null = null;
    let overview = '';
    let posterPath: string | null = null;
    let backdropPath: string | null = null;
    let imdbId: string | null = null;
    let genres: string[] = [];
    let originalLanguage = '';
    let spokenLanguages: string[] = [];
    let dubbedLanguages: string[] = [];
    let streamingPlatforms: string[] = [];
    let tmdbVoteAverage: number | null = null;
    let tmdbVoteCount: number | null = null;

    if (type === 'MOVIE') {
      try {
        const movie = (await fetchMovieDetails(tmdbId)) as any;
        title = movie.title || 'Untitled Movie';
        year = movie.release_date?.substring(0, 4) || '';
        runtime = movie.runtime || null;
        overview = movie.overview || '';
        posterPath = movie.poster_path || null;
        backdropPath = movie.backdrop_path || null;
        imdbId = movie.imdb_id || null;
        genres = movie.genres?.map((g: any) => g.name) || [];
        tmdbVoteAverage = movie.vote_average ? Number(movie.vote_average.toFixed(1)) : null;
        tmdbVoteCount = movie.vote_count || null;
        originalLanguage = movie.original_language || '';

        if (movie.spoken_languages && movie.spoken_languages.length > 0) {
          spokenLanguages = movie.spoken_languages.map((l: any) => l.english_name).filter(Boolean);
        } else if (movie.original_language) {
          spokenLanguages = [movie.original_language.toUpperCase()];
        }

        const transList = movie.translations?.translations || [];
        const transLangs = transList.map((t: any) => t.english_name).filter(Boolean);
        dubbedLanguages = Array.from(new Set(transLangs)).filter((lang) => !spokenLanguages.includes(lang as string)) as string[];

        const wp = movie['watch/providers']?.results;
        const regionWP = wp?.IN?.flatrate || wp?.US?.flatrate || wp?.IN?.rent || wp?.US?.rent || [];
        streamingPlatforms = Array.from(new Set(regionWP.map((p: any) => p.provider_name)));
      } catch (err) {
        console.error('TMDB movie details fetch error:', err);
      }
    } else {
      try {
        const tv = (await fetchTVDetails(tmdbId)) as any;
        title = tv.name || 'Untitled Series';
        year = tv.first_air_date?.substring(0, 4) || '';
        runtime = tv.episode_run_time?.[0] || null;
        overview = tv.overview || '';
        posterPath = tv.poster_path || null;
        backdropPath = tv.backdrop_path || null;
        imdbId = tv.external_ids?.imdb_id || null;
        genres = tv.genres?.map((g: any) => g.name) || [];
        tmdbVoteAverage = tv.vote_average ? Number(tv.vote_average.toFixed(1)) : null;
        tmdbVoteCount = tv.vote_count || null;
        originalLanguage = tv.original_language || '';

        if (tv.spoken_languages && tv.spoken_languages.length > 0) {
          spokenLanguages = tv.spoken_languages.map((l: any) => l.english_name).filter(Boolean);
        } else if (tv.original_language) {
          spokenLanguages = [tv.original_language.toUpperCase()];
        }

        const transList = tv.translations?.translations || [];
        const transLangs = transList.map((t: any) => t.english_name).filter(Boolean);
        dubbedLanguages = Array.from(new Set(transLangs)).filter((lang) => !spokenLanguages.includes(lang as string)) as string[];

        const wp = tv['watch/providers']?.results;
        const regionWP = wp?.IN?.flatrate || wp?.US?.flatrate || wp?.IN?.rent || wp?.US?.rent || [];
        streamingPlatforms = Array.from(new Set(regionWP.map((p: any) => p.provider_name)));
      } catch (err) {
        console.error('TMDB tv details fetch error:', err);
      }
    }

    let imdbRating: number | null = null;
    let imdbVoteCount: number | null = null;

    // Try OMDb lookup with IMDb ID or title + year fallback
    const ratingInfo = await fetchIMDbRating(imdbId, title, year);
    imdbRating = ratingInfo.imdbRating;
    imdbVoteCount = ratingInfo.imdbVoteCount;

    // Fallback to TMDB rating if OMDb returned null/N/A
    if (imdbRating === null && tmdbVoteAverage !== null && tmdbVoteAverage > 0) {
      imdbRating = tmdbVoteAverage;
      imdbVoteCount = tmdbVoteCount;
    }

    return NextResponse.json({
      tmdbId,
      title,
      type,
      year,
      runtime,
      overview,
      posterPath,
      backdropPath,
      imdbId,
      imdbRating,
      imdbVoteCount,
      genres,
      originalLanguage,
      spokenLanguages,
      dubbedLanguages,
      streamingPlatforms,
    });
  } catch (error) {
    console.error('TMDB Details API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
