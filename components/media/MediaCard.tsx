import Image from 'next/image';
import Link from 'next/link';
import { Heart, Film } from 'lucide-react';
import { getStatusLabel, getStatusColor, getTMDBImageUrl } from '@/lib/utils/format';

interface MediaCardProps {
  media?: any;
  layout?: 'vertical' | 'horizontal';
  showProgress?: boolean;
  id?: string;
  title?: string;
  type?: 'MOVIE' | 'SERIES' | string;
  status?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: string | Date | null;
  imdbRating?: number | null;
  myRating?: number | null;
  isFavorite?: boolean;
  currentSeason?: number | null;
  currentEpisode?: number | null;
  totalEpisodes?: number | null;
  watchedEpisodes?: number | null;
  progressPercentage?: number | null;
  genres?: string[];
  platforms?: Array<any>;
  audioLanguages?: string[];
  subtitleLanguages?: string[];
  from?: string;
  href?: string;
  onClick?: () => void;
}

export default function MediaCard({
  media,
  layout = 'horizontal',
  showProgress,
  id,
  title,
  type,
  status,
  posterPath,
  backdropPath,
  releaseDate,
  imdbRating,
  myRating,
  isFavorite,
  currentSeason,
  currentEpisode,
  totalEpisodes,
  watchedEpisodes,
  progressPercentage,
  genres,
  platforms,
  audioLanguages,
  subtitleLanguages,
  from,
  href,
  onClick,
}: MediaCardProps) {
  const mediaId = media?.id || id || '';
  const mediaTitle = media?.title || title || '';
  const mediaType = (media?.type || type || 'MOVIE') as 'MOVIE' | 'SERIES';
  const mediaStatus = media?.status || status || 'PLAN_TO_WATCH';
  const mediaPoster = media?.posterPath !== undefined ? media.posterPath : posterPath;
  const mediaBackdrop = media?.backdropPath !== undefined ? media.backdropPath : backdropPath;
  const mediaRelease = media?.releaseDate !== undefined ? media.releaseDate : releaseDate;
  const mediaImdb = media?.imdbRating !== undefined ? media.imdbRating : imdbRating;
  const mediaMyRating = media?.myRating !== undefined ? media.myRating : myRating;
  const mediaFav = media?.isFavorite !== undefined ? media.isFavorite : isFavorite;
  const mediaSeason = media?.currentSeason !== undefined ? media.currentSeason : currentSeason;
  const mediaEpisode = media?.currentEpisode !== undefined ? media.currentEpisode : currentEpisode;

  
  const rawPlatforms = media?.platforms || platforms || [];
  const platformList: Array<{ name: string; color?: string | null }> = rawPlatforms.map((p: any) =>
    typeof p === 'string' ? { name: p } : { name: p.name, color: p.color }
  );

  const rawGenres = media?.genres || genres || [];
  const genreList: string[] = rawGenres
    .map((g: any) => {
      if (typeof g === 'string') return g;
      if (g && typeof g.name === 'string') return g.name;
      if (g && g.genre && typeof g.genre.name === 'string') return g.genre.name;
      return '';
    })
    .filter(Boolean);

  const rawAudioLangs: string[] = media?.audioLanguages || audioLanguages || [];
  const rawSubLangs: string[] = media?.subtitleLanguages || subtitleLanguages || [];
  const allLangs = Array.from(new Set([...rawAudioLangs, ...rawSubLangs]));

  // Use progressPercentage from media or props.
  const mediaProgress = media?.progressPercentage !== undefined 
    ? media.progressPercentage 
    : progressPercentage;

  let year = '';
  if (mediaRelease) {
    const parsedY = new Date(mediaRelease).getFullYear();
    if (!isNaN(parsedY)) year = String(parsedY);
  }
  const statusColor = getStatusColor(mediaStatus);
  const statusLabel = getStatusLabel(mediaStatus);

  const targetHref = href || (from ? `/library/${mediaId}?from=${encodeURIComponent(from)}` : `/library/${mediaId}`);

  if (layout === 'horizontal') {
    return (
      <Link href={targetHref} onClick={onClick} className="block group w-full">
        <div className="relative w-full h-[155px] sm:h-[165px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-[var(--accent)] hover:shadow-xl group">
          {/* Backdrop background with theme-aware overlay */}
          {mediaBackdrop || mediaPoster ? (
            <Image
              src={getTMDBImageUrl(mediaBackdrop || mediaPoster || '', 'w500') || ''}
              alt={mediaTitle}
              fill
              className="object-cover opacity-15 dark:opacity-35 group-hover:opacity-25 dark:group-hover:opacity-45 transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, 450px"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)]/90 to-transparent" />

          {/* Content Container */}
          <div className="absolute inset-0 p-3 flex gap-3.5 items-center z-10">
            {/* Small poster thumbnail */}
            <div className="relative w-20 sm:w-24 h-full flex-shrink-0 rounded-xl overflow-hidden border border-[var(--border)] shadow-md aspect-[2/3] bg-[var(--bg-muted)]">
              {mediaPoster ? (
                <Image
                  src={getTMDBImageUrl(mediaPoster, 'w185') || ''}
                  alt={mediaTitle}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-6 h-6 text-[var(--text-muted)]" />
                </div>
              )}
            </div>

            {/* Right Details Column */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
              <div>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    mediaType === 'MOVIE' 
                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30' 
                      : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                  }`}>
                    {mediaType}
                  </span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${statusColor}`}>
                    {statusLabel}
                  </span>
                  {mediaFav && (
                    <div className="bg-[var(--bg-elevated)] p-1 rounded-full border border-red-500/40 shadow-sm">
                      <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                    </div>
                  )}
                  {mediaImdb !== null && mediaImdb !== undefined && (
                    <span className="text-[10px] font-extrabold text-[var(--imdb-gold)] bg-[var(--bg-elevated)] px-1.5 py-0.2 rounded border border-[var(--border)] flex items-center gap-0.5 ml-auto">
                      ⭐ {mediaImdb > 0 ? mediaImdb.toFixed(1) : 'N/A'}
                    </span>
                  )}
                  {mediaMyRating !== null && mediaMyRating !== undefined && mediaMyRating > 0 && (
                    <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      💜 {mediaMyRating}
                    </span>
                  )}
                </div>

                <h4 className="font-texturina font-bold text-xs sm:text-sm text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors tracking-tight">
                  {mediaTitle}
                </h4>

                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-medium mt-0.5">
                  <span>{year || '—'}</span>
                  {genreList.length > 0 && (
                    <span className="text-purple-800 dark:text-purple-200 bg-purple-500/15 px-1.5 py-0.2 rounded border border-purple-500/30 truncate max-w-[110px] font-bold">
                      {genreList[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar for Series and Movies */}
              {(showProgress || mediaProgress !== undefined) && mediaProgress !== null && mediaProgress !== undefined && (
                <div className="my-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-purple-700 dark:text-purple-300 mb-0.5">
                    <span>
                      {mediaType === 'SERIES'
                        ? (mediaSeason && mediaEpisode ? `S${mediaSeason} E${mediaEpisode}` : 'Series Progress')
                        : (mediaStatus === 'WATCHED' ? 'Completed' : 'Movie Progress')}
                    </span>
                    <span>{Math.round(mediaProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden p-0.5 border border-purple-500/20">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-[var(--accent)]" style={{ width: `${Math.max(mediaProgress, 4)}%` }} />
                  </div>
                </div>
              )}

              {/* Bottom Row: Platforms & Spoken Audio Languages */}
              <div className="space-y-1">
                {platformList.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {platformList.slice(0, 2).map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: p.color ? `${p.color}20` : 'var(--accent-dim)',
                          color: p.color || 'var(--accent)',
                          borderColor: p.color ? `${p.color}40` : 'var(--border)',
                        }}
                        className="text-[8px] font-bold px-1.5 py-0.2 rounded-md border truncate max-w-[95px] flex items-center gap-0.5"
                      >
                        <span>✓</span> {p.name}
                      </span>
                    ))}
                    {platformList.length > 2 && (
                      <span className="text-[8px] font-semibold text-[var(--text-muted)] bg-[var(--bg-muted)] px-1 rounded">+{platformList.length - 2}</span>
                    )}
                  </div>
                )}
                {allLangs.length > 0 && (
                  <div className="text-[10px] text-cyan-700 dark:text-cyan-300 truncate flex items-center gap-1 font-semibold">
                    <span className="text-[11px]">🎧</span>
                    <span className="truncate">{allLangs.slice(0, 3).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={targetHref} onClick={onClick} className="block group">
      <div className="relative w-full rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-b from-[var(--bg-card)] via-[var(--bg-card)] to-purple-950/30 p-2 sm:p-2.5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-2xl hover:shadow-purple-500/20 group">
        {/* Poster Image Container with Cinematic Overlays */}
        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/80 mb-2 sm:mb-2.5 shadow-lg">
          {mediaPoster ? (
            <Image
              src={getTMDBImageUrl(mediaPoster, 'w500') || ''}
              alt={mediaTitle}
              fill
              className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
              sizes="(max-width: 640px) 160px, (max-width: 1024px) 220px, 260px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-purple-950 flex flex-col items-center justify-center p-3 text-center">
              <Film className="w-10 h-10 text-purple-400/50 mb-2" />
              <span className="text-[11px] font-medium text-[var(--text-muted)] line-clamp-2">{mediaTitle}</span>
            </div>
          )}

          {/* Gradient Vignette overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

          {/* Top badges bar */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-center pointer-events-none z-10">
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg ${
              mediaType === 'MOVIE' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            }`}>
              {mediaType}
            </span>

            <div className="flex items-center gap-1">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-md ${statusColor}`}>
                {statusLabel}
              </span>
              {mediaFav && (
                <div className="bg-black/70 p-1.5 rounded-full backdrop-blur-md border border-red-500/40 shadow-lg animate-pulse">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom rating pills overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 flex-wrap pointer-events-none z-10">
            {mediaImdb !== null && mediaImdb !== undefined && (
              <div className="bg-black/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-[#f5c518]/60 text-[10px] font-extrabold text-[#f5c518] flex items-center gap-1 shadow-lg shadow-black/60">
                <span className="text-[11px]">⭐</span> {mediaImdb > 0 ? mediaImdb.toFixed(1) : 'N/A'}
              </div>
            )}
            {mediaMyRating !== null && mediaMyRating !== undefined && mediaMyRating > 0 && (
              <div className="bg-purple-950/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-purple-400/60 text-[10px] font-extrabold text-purple-200 flex items-center gap-1 shadow-lg shadow-purple-900/50 ml-auto">
                <span>💜</span> {mediaMyRating}/10
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar for TV Series & Movies */}
        {(showProgress || mediaProgress !== undefined) && mediaProgress !== null && mediaProgress !== undefined && (
          <div className="mb-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-purple-600 dark:text-purple-300 mb-1">
              <span>
                {mediaType === 'SERIES'
                  ? (mediaSeason && mediaEpisode ? `S${mediaSeason} E${mediaEpisode}` : 'Progress')
                  : (mediaStatus === 'WATCHED' ? 'Completed' : 'Movie Progress')}
              </span>
              <span>{Math.round(mediaProgress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden p-0.5 border border-purple-500/20">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-[var(--accent)] transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(mediaProgress, 4)}%` }}
              />
            </div>
          </div>
        )}

        {/* Info Content */}
        <div className="px-0.5 space-y-1.5">
          <h3 className="font-texturina font-bold text-xs sm:text-sm text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors tracking-tight">
            {mediaTitle}
          </h3>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-medium">
            <span>{year || '—'}</span>
            {genreList.length > 0 && (
              <span className="text-[10px] bg-purple-500/15 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded border border-purple-500/30 truncate max-w-[100px] font-bold">
                {genreList[0]}
              </span>
            )}
          </div>

          {/* Streaming Platforms */}
          {platformList.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              {platformList.slice(0, 2).map((p, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: p.color ? `${p.color}25` : 'rgba(168,85,247,0.15)',
                    color: p.color || 'var(--accent)',
                    borderColor: p.color ? `${p.color}50` : 'rgba(168,85,247,0.3)',
                  }}
                  className="text-[9px] font-bold px-1.5 py-0.2 rounded-md border truncate max-w-[95px] flex items-center gap-0.5"
                >
                  <span className="text-[8px]">✓</span> {p.name}
                </span>
              ))}
              {platformList.length > 2 && (
                <span className="text-[9px] font-semibold text-[var(--text-muted)] bg-[var(--bg-muted)] px-1 rounded">
                  +{platformList.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Spoken / Dubbed Audio & Subtitle Languages */}
          {allLangs.length > 0 && (
            <div className="text-[10px] text-cyan-700 dark:text-cyan-300 truncate flex items-center gap-1 pt-0.5 font-semibold">
              <span className="text-[11px]">🎧</span>
              <span className="truncate">{allLangs.slice(0, 3).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

