import { notFound, redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Star, Film, Heart } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { getTMDBImageUrl, getStatusLabel, getStatusColor } from '@/lib/utils/format';
import { MediaDetailEditor } from '@/components/library/MediaDetailEditor';
import { SyncButton } from '@/components/library/SyncButton';
import EpisodeProgress from '@/components/series/EpisodeProgress';
import MovieProgressTracker from '@/components/media/MovieProgressTracker';
import BackButton from '@/components/shared/BackButton';

export default async function MediaDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const fromPath = resolvedSearchParams.from || null;
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  if (!session.userId) {
    redirect('/login');
  }

  const [media, allPlatforms] = await Promise.all([
    prisma.media.findUnique({
      where: { 
        id,
        userId: session.userId 
      },
      include: {
        platforms: { include: { platform: true } },
        languages: { include: { language: true } },
        genres: { include: { genre: true } },
        seasons: { include: { episodes: true } },
      }
    }),
    prisma.streamingPlatform.findMany({
      where: { userId: session.userId },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!media) {
    notFound();
  }

  const audioLangs = media.languages.filter(l => l.type === 'AUDIO').map(l => l.language.name);
  const subLangs = media.languages.filter(l => l.type === 'SUBTITLE').map(l => l.language.name);
  const platformIds = media.platforms.map(p => p.platform.id);
  const statusColor = getStatusColor(media.status);
  const statusLabel = getStatusLabel(media.status);

  return (
    <main className="min-h-screen pb-28 animate-fade-in font-[var(--font-texturina)] bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Hero Section */}
      <div className="relative h-[45vh] md:h-[55vh] w-full">
        <div className="absolute inset-0 bg-black">
          {media.backdropPath ? (
            <img 
              src={getTMDBImageUrl(media.backdropPath, 'original') || ''}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-950/40 via-black to-indigo-950/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/70 to-transparent" />
        </div>

        {/* Top Navigation Bar with Back button and Sync button */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <BackButton fromPath={fromPath} />
          <SyncButton mediaId={media.id} variant="hero" />
        </div>
        
        <div className="absolute bottom-0 left-0 w-full px-4 pb-6 flex items-end gap-4 md:gap-6 md:px-8 max-w-5xl mx-auto">
          <div className="w-28 md:w-44 flex-shrink-0 shadow-2xl rounded-xl overflow-hidden border border-white/10 relative aspect-[2/3]">
            {media.posterPath ? (
              <img 
                src={getTMDBImageUrl(media.posterPath, 'w500') || ''}
                alt={media.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[var(--bg-card)] flex items-center justify-center text-xs opacity-50">
                <Film className="w-8 h-8" />
              </div>
            )}
          </div>
          
          <div className="flex-1 pb-2 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${media.type === 'MOVIE' ? 'bg-blue-500/80 text-white' : 'bg-purple-500/80 text-white'}`}>
                {media.type}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                {statusLabel}
              </span>
              {media.isFavorite && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-current" /> Favorite
                </span>
              )}
              {media.genres && media.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  {media.genres.map((g: any, idx: number) => {
                    const genreName = typeof g === 'string' ? g : g?.genre?.name || g?.name || '';
                    if (!genreName) return null;
                    return (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-800 dark:text-purple-200 border border-purple-500/30"
                      >
                        {genreName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 line-clamp-2">{media.title}</h1>
            
            <div className="flex flex-wrap items-center gap-3 text-xs opacity-80">
              {media.releaseDate && (
                <span>{new Date(media.releaseDate).getFullYear()}</span>
              )}
              {media.runtime && (
                <>
                  <span>•</span>
                  <span>{media.runtime} min</span>
                </>
              )}
              {media.imdbRating && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[var(--imdb-gold)] font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> {media.imdbRating.toFixed(1)} IMDb
                  </span>
                </>
              )}
              {media.myRating && (
                <>
                  <span>•</span>
                  <span className="text-purple-700 dark:text-purple-300 font-bold">
                    💜 {media.myRating}/10 (My Rating)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-6 max-w-5xl mx-auto space-y-6">
        {/* Overview Description */}
        {media.description && (
          <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Overview</h3>
            <p className="text-sm md:text-base opacity-90 leading-relaxed">{media.description}</p>
          </section>
        )}

        {/* Series Episode Progress Tracker */}
        {media.type === 'SERIES' && media.seasons && media.seasons.length > 0 && (
          <EpisodeProgress
            mediaId={media.id}
            currentSeason={media.currentSeason || 1}
            currentEpisode={media.currentEpisode || 1}
            totalSeasons={media.totalSeasons}
            totalEpisodes={media.totalEpisodes}
            watchedEpisodes={media.watchedEpisodes || 0}
            progressPercentage={media.progressPercentage || 0}
            seasons={(media.seasons || []).map((s: any) => ({
              seasonNumber: s.seasonNumber,
              episodes: (s.episodes || []).map((e: any) => ({
                id: e.id,
                seasonNumber: e.seasonNumber,
                episodeNumber: e.episodeNumber,
                name: e.name || `Episode ${e.episodeNumber}`,
                airDate: e.airDate ? new Date(e.airDate).toLocaleDateString() : null,
                watched: Boolean(e.isWatched),
              })),
            }))}
          />
        )}

        {/* Movie Watch Progress Tracker */}
        {media.type === 'MOVIE' && (
          <MovieProgressTracker
            mediaId={media.id}
            initialProgress={media.progressPercentage || (media.status === 'WATCHED' ? 100 : 0)}
            runtime={media.runtime}
            initialStatus={media.status}
          />
        )}

        {/* Customization & Delete Editor */}
        <MediaDetailEditor
          mediaId={media.id}
          initialStatus={media.status}
          initialMyRating={media.myRating}
          initialIsFavorite={media.isFavorite}
          initialNotes={media.notes}
          initialAudioLanguages={audioLangs}
          initialSubtitleLanguages={subLangs}
          initialPlatformIds={platformIds}
          allPlatforms={allPlatforms}
        />
      </div>
    </main>
  );
}
