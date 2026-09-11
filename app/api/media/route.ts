import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { fetchMovieDetails, fetchTVDetails, fetchSeason } from '@/lib/services/tmdb';
import { fetchIMDbRating } from '@/lib/services/imdb';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const isFavorite = searchParams.get('isFavorite');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt_desc';
    const platform = searchParams.get('platform');
    const genre = searchParams.get('genre');
    const language = searchParams.get('language');
    const minRating = searchParams.get('minRating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { userId: session.userId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (isFavorite === 'true') where.isFavorite = true;
    if (search) where.title = { contains: search };
    if (minRating) where.imdbRating = { gte: parseFloat(minRating) };
    if (platform) where.platforms = { some: { platformId: platform } };
    if (genre) where.genres = { some: { genreId: genre } };
    if (language) {
      where.languages = { some: { languageId: language } };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' };
    else if (sort === 'title_asc') orderBy = { title: 'asc' };
    else if (sort === 'title_desc') orderBy = { title: 'desc' };
    else if (sort === 'imdbRating_desc') orderBy = { imdbRating: 'desc' };
    else if (sort === 'myRating_desc') orderBy = { myRating: 'desc' };
    else if (sort === 'releaseDate_desc') orderBy = { releaseDate: 'desc' };
    else if (sort === 'releaseDate_asc') orderBy = { releaseDate: 'asc' };
    else if (sort === 'watchedAt_desc') orderBy = { watchedAt: 'desc' };

    const skip = (page - 1) * limit;

    const [total, media] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          genres: { include: { genre: true } },
          platforms: { include: { platform: true } },
          languages: { include: { language: true } },
        }
      })
    ]);

    const formattedMedia = media.map(m => ({
      id: m.id,
      title: m.title,
      type: m.type,
      status: m.status,
      posterPath: m.posterPath,
      backdropPath: m.backdropPath,
      releaseDate: m.releaseDate,
      runtime: m.runtime,
      imdbRating: m.imdbRating,
      myRating: m.myRating,
      isFavorite: m.isFavorite,
      currentSeason: m.currentSeason,
      currentEpisode: m.currentEpisode,
      totalSeasons: m.totalSeasons,
      totalEpisodes: m.totalEpisodes,
      watchedEpisodes: m.watchedEpisodes,
      progressPercentage: m.progressPercentage ?? (m.status === 'WATCHED' ? 100 : 0),
      createdAt: m.createdAt,
      genres: m.genres.map(g => g.genre.name),
      platforms: m.platforms.map(p => ({ id: p.platform.id, name: p.platform.name, color: p.platform.color })),
      audioLanguages: m.languages.filter(l => l.type === 'AUDIO').map(l => l.language.name),
      subtitleLanguages: m.languages.filter(l => l.type === 'SUBTITLE').map(l => l.language.name),
    }));

    return NextResponse.json({
      media: formattedMedia,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Media GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function parseValidDate(dateStr: any): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tmdbId, type, status, platformIds, audioLanguages, subtitleLanguages, isFavorite, notes, genres: inputGenres } = body;

    const numericTmdbId = Number(tmdbId);
    if (!numericTmdbId) {
      return NextResponse.json({ error: 'Valid tmdbId is required' }, { status: 400 });
    }

    const existing = await prisma.media.findFirst({
      where: { userId: session.userId, tmdbId: numericTmdbId }
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    let title = '';
    let imdbId: string | null = null;
    let posterPath: string | null = null;
    let backdropPath: string | null = null;
    let description: string | null = null;
    let releaseDate: Date | null = null;
    let runtime: number | null = null;
    let totalSeasons: number | null = null;
    let totalEpisodes: number | null = null;
    let autoProviders: string[] = [];
    let autoLanguages: string[] = [];
    let autoGenres: string[] = [];
    if (inputGenres && Array.isArray(inputGenres)) {
      autoGenres = inputGenres.map((g: any) => typeof g === 'string' ? g : g?.name).filter(Boolean);
    }
    let tmdbVoteAverage: number | null = null;
    let tmdbVoteCount: number | null = null;
    let releaseYear = '';

    if (type === 'MOVIE') {
      try {
        const movie = (await fetchMovieDetails(numericTmdbId)) as any;
        title = movie.title || body.title || 'Untitled Movie';
        imdbId = movie.imdb_id || null;
        posterPath = movie.poster_path || body.posterPath || null;
        backdropPath = movie.backdrop_path || null;
        description = movie.overview || null;
        releaseDate = parseValidDate(movie.release_date);
        releaseYear = movie.release_date?.substring(0, 4) || '';
        runtime = movie.runtime;
        tmdbVoteAverage = movie.vote_average ? Number(movie.vote_average.toFixed(1)) : null;
        tmdbVoteCount = movie.vote_count || null;

        if (movie.genres && Array.isArray(movie.genres)) {
          movie.genres.forEach((g: any) => {
            const gName = typeof g === 'string' ? g : g?.name;
            if (gName && !autoGenres.includes(gName)) autoGenres.push(gName);
          });
        }

        // Auto languages
        if (movie.spoken_languages && movie.spoken_languages.length > 0) {
          autoLanguages = movie.spoken_languages.map((l: any) => l.english_name).filter(Boolean);
        }

        // Auto watch providers (IN region first, then US, then any)
        const wp = movie['watch/providers']?.results;
        const regionWP = wp?.IN?.flatrate || wp?.US?.flatrate || wp?.IN?.rent || wp?.US?.rent || [];
        autoProviders = regionWP.map((p: any) => p.provider_name);
      } catch {
        title = body.title || 'Untitled Movie';
        posterPath = body.posterPath || null;
      }
    } else {
      try {
        const tv = (await fetchTVDetails(numericTmdbId)) as any;
        title = tv.name || body.title || 'Untitled Series';
        imdbId = tv.external_ids?.imdb_id || null;
        posterPath = tv.poster_path || body.posterPath || null;
        backdropPath = tv.backdrop_path || null;
        description = tv.overview || null;
        releaseDate = parseValidDate(tv.first_air_date);
        releaseYear = tv.first_air_date?.substring(0, 4) || '';
        runtime = tv.episode_run_time?.[0] || null;
        totalSeasons = tv.number_of_seasons || null;
        totalEpisodes = tv.number_of_episodes || null;
        tmdbVoteAverage = tv.vote_average ? Number(tv.vote_average.toFixed(1)) : null;
        tmdbVoteCount = tv.vote_count || null;

        if (tv.genres && Array.isArray(tv.genres)) {
          tv.genres.forEach((g: any) => {
            const gName = typeof g === 'string' ? g : g?.name;
            if (gName && !autoGenres.includes(gName)) autoGenres.push(gName);
          });
        }

        // Auto languages
        if (tv.spoken_languages && tv.spoken_languages.length > 0) {
          autoLanguages = tv.spoken_languages.map((l: any) => l.english_name).filter(Boolean);
        }

        // Auto watch providers
        const wp = tv['watch/providers']?.results;
        const regionWP = wp?.IN?.flatrate || wp?.US?.flatrate || wp?.IN?.rent || wp?.US?.rent || [];
        autoProviders = regionWP.map((p: any) => p.provider_name);
      } catch {
        title = body.title || 'Untitled Series';
        posterPath = body.posterPath || null;
      }
    }

    if (imdbId) {
      const existingImdb = await prisma.media.findFirst({
        where: { userId: session.userId, imdbId },
      });
      if (existingImdb) {
        return NextResponse.json(existingImdb);
      }
    }

    let imdbRating: number | null = body.imdbRating ? Number(body.imdbRating) : null;
    let imdbVoteCount: number | null = null;

    // Fetch rating from OMDb using IMDb ID or title + year fallback
    if (!imdbRating) {
      const ratingInfo = await fetchIMDbRating(imdbId, title, releaseYear);
      if (ratingInfo.imdbRating) {
        imdbRating = ratingInfo.imdbRating;
        imdbVoteCount = ratingInfo.imdbVoteCount;
      }
    }

    // Fallback to TMDB rating if OMDb rating is null
    if (!imdbRating && tmdbVoteAverage !== null && tmdbVoteAverage > 0) {
      imdbRating = tmdbVoteAverage;
      imdbVoteCount = tmdbVoteCount;
    }

    const validStatuses = ['UNASSIGNED', 'WANT_TO_WATCH', 'WATCHING', 'WATCHED', 'ON_HOLD', 'DROPPED'];
    const initialStatus = validStatuses.includes(status) ? status : 'UNASSIGNED';
    let initialProgress = 0;
    let initialWatchedEpisodes = 0;
    let initialWatchedAt: Date | null = null;
    if (initialStatus === 'WATCHED') {
      initialProgress = 100;
      initialWatchedEpisodes = type === 'MOVIE' ? 1 : (totalEpisodes || 1);
      initialWatchedAt = new Date();
    } else if (initialStatus === 'WATCHING') {
      initialProgress = type === 'MOVIE' ? 50 : (totalEpisodes ? Math.round((1 / totalEpisodes) * 100) : 10);
      initialWatchedEpisodes = type === 'MOVIE' ? 0 : 1;
    }

    const newMedia = await prisma.media.create({
      data: {
        userId: session.userId,
        tmdbId: numericTmdbId,
        imdbId,
        title,
        type: type as any,
        status: initialStatus as any,
        progressPercentage: initialProgress,
        watchedEpisodes: initialWatchedEpisodes,
        watchedAt: initialWatchedAt,
        posterPath,
        backdropPath,
        description,
        releaseDate,
        runtime,
        totalSeasons,
        totalEpisodes,
        imdbRating,
        imdbVoteCount,
        isFavorite: isFavorite || false,
        notes: notes || null,
      },
    });

    // Save & link Genres to database
    if (autoGenres.length > 0) {
      for (const genreName of autoGenres) {
        if (!genreName || typeof genreName !== 'string') continue;
        const cleanName = genreName.trim();
        if (!cleanName) continue;
        try {
          const genreRecord = await prisma.genre.upsert({
            where: { name: cleanName },
            update: {},
            create: { name: cleanName },
          });
          await prisma.mediaGenre.create({
            data: {
              mediaId: newMedia.id,
              genreId: genreRecord.id,
            },
          }).catch(() => {});
        } catch {
          // ignore individual genre error
        }
      }
    }

    // Link user-selected or auto-discovered platforms
    const finalPlatformIds: string[] = platformIds && Array.isArray(platformIds) ? [...platformIds] : [];

    if (autoProviders.length > 0) {
      for (const provName of autoProviders) {
        // Find or create platform for user
        let userPlatform = await prisma.streamingPlatform.findFirst({
          where: { userId: session.userId, name: { contains: provName } }
        });
        if (!userPlatform) {
          userPlatform = await prisma.streamingPlatform.create({
            data: {
              userId: session.userId,
              name: provName,
            }
          }).catch(() => null);
        }
        if (userPlatform && !finalPlatformIds.includes(userPlatform.id)) {
          finalPlatformIds.push(userPlatform.id);
        }
      }
    }

    if (finalPlatformIds.length > 0) {
      await prisma.mediaStreamingPlatform.createMany({
        data: finalPlatformIds.map((pid: string) => ({
          mediaId: newMedia.id,
          platformId: pid
        }))
      });
    }

    // Link audio & subtitle languages
    const finalAudioLangs = Array.from(new Set([
      ...(audioLanguages && Array.isArray(audioLanguages) ? audioLanguages : []),
      ...autoLanguages
    ]));

    if (finalAudioLangs.length > 0) {
      for (const langName of finalAudioLangs) {
        const lang = await prisma.language.upsert({
          where: { name: langName },
          update: {},
          create: { name: langName }
        });
        await prisma.mediaLanguage.create({
          data: {
            mediaId: newMedia.id,
            languageId: lang.id,
            type: 'AUDIO'
          }
        }).catch(() => {});
      }
    }

    if (subtitleLanguages && Array.isArray(subtitleLanguages) && subtitleLanguages.length > 0) {
      for (const langName of subtitleLanguages) {
        const lang = await prisma.language.upsert({
          where: { name: langName },
          update: {},
          create: { name: langName }
        });
        await prisma.mediaLanguage.create({
          data: {
            mediaId: newMedia.id,
            languageId: lang.id,
            type: 'SUBTITLE'
          }
        }).catch(() => {});
      }
    }

    if (type === 'SERIES' && totalSeasons && totalSeasons > 0) {
      const seasonPromises = [];
      const maxSeasons = Math.min(totalSeasons, 15);
      for (let sNum = 1; sNum <= maxSeasons; sNum++) {
        seasonPromises.push(fetchSeason(numericTmdbId, sNum).catch(() => null));
      }
      const seasonsData = await Promise.all(seasonPromises);

      for (const seasonData of seasonsData) {
        if (!seasonData) continue;
        try {
          const season = await prisma.season.create({
            data: {
              mediaId: newMedia.id,
              seasonNumber: seasonData.season_number,
              name: seasonData.name,
              overview: seasonData.overview,
              posterPath: seasonData.poster_path,
              episodeCount: seasonData.episodes?.length || 0,
              airDate: parseValidDate(seasonData.air_date)
            }
          });

          if (seasonData.episodes && seasonData.episodes.length > 0) {
            await prisma.episode.createMany({
              data: seasonData.episodes.map((ep) => ({
                seasonId: season.id,
                episodeNumber: ep.episode_number,
                name: ep.name,
                overview: ep.overview,
                stillPath: ep.still_path,
                runtime: ep.runtime,
                airDate: parseValidDate(ep.air_date)
              }))
            });
          }
        } catch {
          // Ignore individual season insertion errors
        }
      }
    }

    return NextResponse.json(newMedia);
  } catch (error: any) {
    console.error('Media POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create media entry' }, { status: 500 });
  }
}
