import Image from 'next/image';
import Link from 'next/link';
import { Star, Play, Globe, Tv, Heart, Film, ArrowRight } from 'lucide-react';
import { getTMDBImageUrl, getStatusLabel, getStatusColor } from '@/lib/utils/format';

interface HomeMediaItem {
  id: string;
  title: string;
  type: 'MOVIE' | 'SERIES' | string;
  status: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: string | Date | null;
  imdbRating?: number | null;
  myRating?: number | null;
  isFavorite?: boolean;
  currentSeason?: number | null;
  currentEpisode?: number | null;
  progressPercentage?: number | null;
  genres?: string[];
  platforms?: Array<{ name: string; color?: string | null }>;
  audioLanguages?: string[];
  subtitleLanguages?: string[];
}

// 1. WATCHLIST CARD: Full Theme-Aware Horizontal Card Layout
export function WatchlistCard({ media }: { media: HomeMediaItem }) {
  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : '';
  const platforms = media.platforms || [];
  const audioLangs = media.audioLanguages || [];
  const genres = (media.genres || []).map((g: any) => {
    if (typeof g === 'string') return g;
    if (g && typeof g.name === 'string') return g.name;
    if (g && g.genre && typeof g.genre.name === 'string') return g.genre.name;
    return '';
  }).filter(Boolean);

  return (
    <Link href={`/library/${media.id}`} className="block group">
      <div className="relative w-[250px] sm:w-[285px] h-[145px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] shadow-md transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-xl group">
        {/* Backdrop background image with theme-aware overlay */}
        {media.backdropPath || media.posterPath ? (
          <Image
            src={getTMDBImageUrl(media.backdropPath || media.posterPath || '', 'w500') || ''}
            alt={media.title}
            fill
            className="object-cover opacity-15 dark:opacity-35 group-hover:opacity-25 dark:group-hover:opacity-45 transition-opacity"
            sizes="285px"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)]/90 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 p-3 flex gap-3 items-center z-10">
          {/* Small poster thumbnail */}
          <div className="relative w-16 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-[var(--border)] shadow-md aspect-[2/3] bg-[var(--bg-muted)]">
            {media.posterPath ? (
              <Image
                src={getTMDBImageUrl(media.posterPath, 'w185') || ''}
                alt={media.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                  media.type === 'MOVIE' 
                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30' 
                    : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                }`}>
                  {media.type}
                </span>
                {media.imdbRating && (
                  <span className="text-[10px] font-bold text-[var(--imdb-gold)] flex items-center gap-0.5 bg-[var(--bg-elevated)] px-1.5 py-0.2 rounded border border-[var(--border)]">
                    ⭐ {media.imdbRating.toFixed(1)}
                  </span>
                )}
              </div>
              <h4 className="font-texturina font-bold text-xs sm:text-sm text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                {media.title}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-medium">
                <span>{year}</span>
                {genres.length > 0 && (
                  <span className="text-purple-800 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1 py-0.1 rounded text-[9px] font-bold truncate max-w-[85px]">
                    {genres[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Audio & Platform badges */}
            <div className="space-y-1">
              {platforms.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {platforms.slice(0, 2).map((p, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: p.color ? `${p.color}20` : 'var(--accent-dim)',
                        color: p.color || 'var(--accent)',
                        borderColor: p.color ? `${p.color}40` : 'var(--border)',
                      }}
                      className="text-[8px] font-bold px-1.5 py-0.2 rounded-md border truncate max-w-[80px]"
                    >
                      ✓ {p.name}
                    </span>
                  ))}
                </div>
              )}
              {audioLangs.length > 0 && (
                <p className="text-[9px] text-cyan-700 dark:text-cyan-300 font-semibold truncate flex items-center gap-1">
                  <span>🎧</span> <span className="truncate">{audioLangs.slice(0, 2).join(', ')}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 2. RECENTLY ADDED CARD: Vertical Poster-Style Layout
export function RecentlyAddedCard({ media }: { media: HomeMediaItem }) {
  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : '';
  const platforms = media.platforms || [];
  const statusColor = getStatusColor(media.status);
  const statusLabel = getStatusLabel(media.status);
  const genres = (media.genres || []).map((g: any) => {
    if (typeof g === 'string') return g;
    if (g && typeof g.name === 'string') return g.name;
    if (g && g.genre && typeof g.genre.name === 'string') return g.genre.name;
    return '';
  }).filter(Boolean);

  return (
    <Link href={`/library/${media.id}`} className="block group">
      <div className="relative w-[145px] sm:w-[165px] rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-b from-[var(--bg-card)] via-[var(--bg-card)] to-purple-950/30 p-2 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-2xl hover:shadow-purple-500/20 group">
        {/* Poster Thumbnail */}
        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/80 mb-2 shadow-md">
          {media.posterPath ? (
            <Image
              src={getTMDBImageUrl(media.posterPath, 'w500') || ''}
              alt={media.title}
              fill
              className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
              sizes="165px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-purple-950 flex flex-col items-center justify-center p-3 text-center">
              <Film className="w-8 h-8 text-purple-400/50 mb-1" />
              <span className="text-[10px] text-[var(--text-muted)] line-clamp-2">{media.title}</span>
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-center pointer-events-none z-10">
            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-md ${
              media.type === 'MOVIE' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            }`}>
              {media.type}
            </span>
            {media.imdbRating && (
              <span className="text-[9px] font-bold text-[#f5c518] bg-black/80 backdrop-blur-md px-1.5 py-0.2 rounded-md border border-[#f5c518]/50 flex items-center gap-0.5 shadow-md">
                ⭐ {media.imdbRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Info Below Poster */}
        <div className="px-0.5 space-y-1">
          <h4 className="font-texturina font-bold text-xs text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
            {media.title}
          </h4>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-medium">
            <span>{year || '—'}</span>
            {genres.length > 0 && (
              <span className="bg-purple-500/15 text-purple-800 dark:text-purple-200 border border-purple-500/30 px-1 py-0.1 rounded text-[9px] font-bold truncate max-w-[75px]">
                {genres[0]}
              </span>
            )}
          </div>

          {/* Streaming Platforms */}
          {platforms.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              {platforms.slice(0, 2).map((p, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: p.color ? `${p.color}20` : 'var(--accent-dim)',
                    color: p.color || 'var(--accent)',
                    borderColor: p.color ? `${p.color}40` : 'var(--border)',
                  }}
                  className="text-[8px] font-bold px-1 py-0.1 rounded border truncate max-w-[75px]"
                >
                  ✓ {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// 3. CONTINUE WATCHING CARD: Progress focus card
export function ContinueWatchingCard({ media }: { media: HomeMediaItem }) {
  const progress = media.progressPercentage ?? 0;

  return (
    <Link href={`/library/${media.id}`} className="block group">
      <div className="relative w-[220px] sm:w-[250px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-[var(--accent)]">
        <div className="relative h-[120px] w-full bg-black overflow-hidden">
          {media.backdropPath || media.posterPath ? (
            <Image
              src={getTMDBImageUrl(media.backdropPath || media.posterPath || '', 'w500') || ''}
              alt={media.title}
              fill
              className="object-cover opacity-60 group-hover:opacity-75 transition-opacity"
              sizes="250px"
            />
          ) : (
            <div className="w-full h-full bg-purple-950/40 flex items-center justify-center">
              <Film className="w-8 h-8 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Play Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/80 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform backdrop-blur-sm">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Season / Episode Badge for Series or Movie Badge */}
          {media.type === 'SERIES' && media.currentSeason && media.currentEpisode ? (
            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-purple-200 border border-purple-500/30">
              S{media.currentSeason} • E{media.currentEpisode}
            </div>
          ) : (
            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-blue-200 border border-blue-500/30 uppercase tracking-wider">
              {media.type}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/10">
          <div className="h-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Footer info */}
        <div className="p-2.5 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
              {media.title}
            </h4>
            <p className="text-[10px] text-[var(--text-muted)]">{progress}% completed</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
