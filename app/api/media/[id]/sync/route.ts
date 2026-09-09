import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { fetchMovieDetails, fetchTVDetails, fetchSeason } from '@/lib/services/tmdb';
import { fetchIMDbRating } from '@/lib/services/imdb';

function parseValidDate(dateStr: any): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

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
      return NextResponse.json({ error: 'Media entry not found' }, { status: 404 });
    }

    const numericTmdbId = media.tmdbId;
    if (!numericTmdbId) {
      return NextResponse.json({ error: 'No TMDB ID linked to this item' }, { status: 400 });
    }

    const syncedFields: string[] = [];
    let updatedTitle = media.title;
    let updatedDescription = media.description;
    let updatedPosterPath = media.posterPath;
    let updatedBackdropPath = media.backdropPath;
    let updatedReleaseDate = media.releaseDate;
    let updatedRuntime = media.runtime;
    let updatedSeasons = media.totalSeasons;
    let updatedEpisodes = media.totalEpisodes;
    let imdbId = media.imdbId;
    let tmdbVoteAverage: number | null = null;
    let tmdbVoteCount: number | null = null;

    let autoGenres: string[] = [];
    let autoLanguages: string[] = [];
    let autoProviders: string[] = [];
    let releaseYear = '';

    if (media.type === 'MOVIE') {
      try {
        const movie = (await fetchMovieDetails(numericTmdbId)) as any;
        if (movie) {
          updatedTitle = movie.title || media.title;
          imdbId = movie.imdb_id || media.imdbId;
          updatedPosterPath = movie.poster_path || media.posterPath;
          updatedBackdropPath = movie.backdrop_path || media.backdropPath;
          updatedDescription = movie.overview || media.description;
          updatedReleaseDate = parseValidDate(movie.release_date) || media.releaseDate;
          releaseYear = movie.release_date?.substring(0, 4) || '';
          updatedRuntime = movie.runtime || media.runtime;
          tmdbVoteAverage = movie.vote_average ? Number(movie.vote_average.toFixed(1)) : null;
          tmdbVoteCount = movie.vote_count || null;

          if (movie.genres && Array.isArray(movie.genres)) {
            autoGenres = movie.genres.map((g: any) => typeof g === 'string' ? g : g?.name).filter(Boolean);
          }

          if (movie.spoken_languages && Array.isArray(movie.spoken_languages)) {
            autoLanguages = movie.spoken_languages.map((l: any) => l.english_name).filter(Boolean);
          }

          const wp = movie['watch/providers']?.results;
          const regionWP = wp?.IN?.flatrate || wp?.US?.flatrate || wp?.IN?.rent || wp?.US?.rent || [];
          autoProviders = regionWP.map((p: any) => p.provider_name);

          syncedFields.push('Movie Details & Synopsis', 'Poster & Backdrop Images');
        }
      } catch (err) {
        console.error('TMDB movie sync error:', err);
      }
    } else {
      try {
        const tv = (await fetchTVDetails(numericTmdbId)) as any;
        if (tv) {
          updatedTitle = tv.name || media.title;
          imdbId = tv.external_ids?.imdb_id || media.imdbId;
          updatedPosterPath = tv.poster_path || media.posterPath;
          updatedBackdropPath = tv.backdrop_path || media.backdropPath;
          updatedDescription = tv.overview || media.description;
          updatedReleaseDate = parseValidDate(tv.first_air_date) || media.releaseDate;
          releaseYear = tv.first_air_date?.substring(0, 4) || '';
          updatedRuntime = tv.episode_run_time?.[0] || media.runtime;
          updatedSeasons = tv.number_of_seasons || media.totalSeasons;
          updatedEpisodes = tv.number_of_episodes || media.totalEpisodes;
          tmdbVoteAverage = tv.vote_average ? Number(tv.vote_average.toFixed(1)) : null;
          tmdbVoteCount = tv.vote_count || null;

          if (tv.genres && Array.isArray(tv.genres)) {
            autoGenres = tv.genres.map((g: any) => typeof g === 'string' ? g : g?.name).filter(Boolean);
          }

          if (tv.spoken_languages && Array.isArray(tv.spoken_languages)) {
            autoLanguages = tv.spoken_languages.map((l: any) => l.english_name).filter(Boolean);
          }

          const wp = tv['watch/providers']?.results;
          const regionWP = wp?.IN?.flatrate || wp?.US?.flatrate || wp?.IN?.rent || wp?.US?.rent || [];
          autoProviders = regionWP.map((p: any) => p.provider_name);

          syncedFields.push('TV Series Details', 'Seasons & Episode Count');
        }
      } catch (err) {
        console.error('TMDB TV sync error:', err);
      }
    }

    // Fetch fresh IMDb rating & votes
    let newImdbRating = media.imdbRating;
    let newImdbVoteCount = media.imdbVoteCount;

    const ratingInfo = await fetchIMDbRating(imdbId, updatedTitle, releaseYear);
    if (ratingInfo?.imdbRating) {
      newImdbRating = ratingInfo.imdbRating;
      newImdbVoteCount = ratingInfo.imdbVoteCount;
      syncedFields.push('Fresh IMDb Rating & Vote Count');
    } else if (tmdbVoteAverage && tmdbVoteAverage > 0) {
      newImdbRating = tmdbVoteAverage;
      newImdbVoteCount = tmdbVoteCount;
      syncedFields.push('Fresh TMDB Rating');
    }

    // Update Media Record
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        title: updatedTitle,
        description: updatedDescription,
        posterPath: updatedPosterPath,
        backdropPath: updatedBackdropPath,
        releaseDate: updatedReleaseDate,
        runtime: updatedRuntime,
        totalSeasons: updatedSeasons,
        totalEpisodes: updatedEpisodes,
        imdbId,
        imdbRating: newImdbRating,
        imdbVoteCount: newImdbVoteCount,
        imdbRatingUpdatedAt: new Date(),
      },
    });

    // Sync Genres
    if (autoGenres.length > 0) {
      await prisma.mediaGenre.deleteMany({ where: { mediaId } });
      for (const genreName of autoGenres) {
        const cleanName = genreName.trim();
        if (!cleanName) continue;
        try {
          const genreRecord = await prisma.genre.upsert({
            where: { name: cleanName },
            update: {},
            create: { name: cleanName },
          });
          await prisma.mediaGenre.create({
            data: { mediaId, genreId: genreRecord.id },
          }).catch(() => {});
        } catch {
          // ignore
        }
      }
      syncedFields.push('Genres & Category Tags');
    }

    // Sync Streaming Platforms
    if (autoProviders.length > 0) {
      for (const provName of autoProviders) {
        let userPlatform = await prisma.streamingPlatform.findFirst({
          where: { userId: session.userId, name: { contains: provName } },
        });
        if (!userPlatform) {
          userPlatform = await prisma.streamingPlatform.create({
            data: { userId: session.userId, name: provName },
          }).catch(() => null);
        }
        if (userPlatform) {
          await prisma.mediaStreamingPlatform.upsert({
            where: { mediaId_platformId: { mediaId, platformId: userPlatform.id } },
            update: {},
            create: { mediaId, platformId: userPlatform.id },
          }).catch(() => {});
        }
      }
      syncedFields.push('Streaming Availability');
    }

    // Sync Spoken Languages
    if (autoLanguages.length > 0) {
      for (const langName of autoLanguages) {
        try {
          const lang = await prisma.language.upsert({
            where: { name: langName },
            update: {},
            create: { name: langName },
          });
          await prisma.mediaLanguage.create({
            data: { mediaId, languageId: lang.id, type: 'AUDIO' },
          }).catch(() => {});
        } catch {
          // ignore
        }
      }
      syncedFields.push('Spoken Audio Languages');
    }

    // Sync TV Seasons & Episodes
    if (media.type === 'SERIES' && updatedSeasons && updatedSeasons > 0) {
      const maxSeasons = Math.min(updatedSeasons, 15);
      const seasonPromises = [];
      for (let sNum = 1; sNum <= maxSeasons; sNum++) {
        seasonPromises.push(fetchSeason(numericTmdbId, sNum).catch(() => null));
      }
      const seasonsData = await Promise.all(seasonPromises);

      for (const seasonData of seasonsData) {
        if (!seasonData) continue;
        try {
          const season = await prisma.season.upsert({
            where: { mediaId_seasonNumber: { mediaId, seasonNumber: seasonData.season_number } },
            update: {
              name: seasonData.name,
              overview: seasonData.overview,
              posterPath: seasonData.poster_path,
              episodeCount: seasonData.episodes?.length || 0,
              airDate: parseValidDate(seasonData.air_date),
            },
            create: {
              mediaId,
              seasonNumber: seasonData.season_number,
              name: seasonData.name,
              overview: seasonData.overview,
              posterPath: seasonData.poster_path,
              episodeCount: seasonData.episodes?.length || 0,
              airDate: parseValidDate(seasonData.air_date),
            },
          });

          if (seasonData.episodes && seasonData.episodes.length > 0) {
            for (const ep of seasonData.episodes) {
              await prisma.episode.upsert({
                where: { seasonId_episodeNumber: { seasonId: season.id, episodeNumber: ep.episode_number } },
                update: {
                  name: ep.name,
                  overview: ep.overview,
                  stillPath: ep.still_path,
                  runtime: ep.runtime,
                  airDate: parseValidDate(ep.air_date),
                },
                create: {
                  seasonId: season.id,
                  episodeNumber: ep.episode_number,
                  name: ep.name,
                  overview: ep.overview,
                  stillPath: ep.still_path,
                  runtime: ep.runtime,
                  airDate: parseValidDate(ep.air_date),
                },
              }).catch(() => {});
            }
          }
        } catch {
          // ignore individual season error
        }
      }
      syncedFields.push('Newly Aired Seasons & Episode Guide');
    }

    return NextResponse.json({
      success: true,
      message: 'Fresh metadata synced successfully!',
      syncedFields: Array.from(new Set(syncedFields)),
      media: updatedMedia,
    });
  } catch (error: any) {
    console.error('Media sync error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to sync metadata' }, { status: 500 });
  }
}
