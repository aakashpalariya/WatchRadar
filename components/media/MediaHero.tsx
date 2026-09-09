import Image from 'next/image';
import { Star } from 'lucide-react';
import { getTMDBImageUrl, formatRuntime } from '@/lib/utils/format';
import FavoriteButton from '@/components/shared/FavoriteButton';
import StatusBadge from '@/components/shared/StatusBadge';

interface MediaHeroProps {
  id: string;
  title: string;
  type: 'MOVIE' | 'SERIES';
  releaseDate: string | null;
  runtime: number | null;
  imdbRating: number | null;
  imdbVoteCount: number | null;
  backdropPath: string | null;
  posterPath: string | null;
  isFavorite: boolean;
  status: string;
  onFavoriteToggle?: (newState: boolean) => void;
}

export default function MediaHero({
  id,
  title,
  type,
  releaseDate,
  runtime,
  imdbRating,
  imdbVoteCount,
  backdropPath,
  posterPath,
  isFavorite,
  status,
  onFavoriteToggle,
}: MediaHeroProps) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const backdropUrl = backdropPath ? getTMDBImageUrl(backdropPath, 'w1280') : null;
  const posterUrl = posterPath ? getTMDBImageUrl(posterPath, 'w500') : null;

  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] bg-[var(--bg-muted)] overflow-hidden">
      {/* Backdrop Image */}
      {backdropUrl && (
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={backdropUrl}
            alt={`${title} backdrop`}
            fill
            className="object-cover object-top opacity-60"
            priority
          />
        </div>
      )}
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/80 to-transparent sm:via-[var(--bg-card)]/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)]/60 to-transparent hidden sm:block" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-end sm:items-start gap-6">
            
            {/* Poster Thumbnail - Hidden on mobile, visible on tablet+ */}
            {posterUrl && (
              <div className="hidden sm:block relative w-32 md:w-48 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-[var(--border)] flex-shrink-0 flex-grow-0 -mt-16 z-10">
                <Image
                  src={posterUrl}
                  alt={`${title} poster`}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Info Section */}
            <div className="flex flex-col flex-grow w-full z-10">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <StatusBadge status={status} size="md" />
                <span className={`badge uppercase font-bold tracking-wider ${type === 'MOVIE' ? 'badge-movie bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'badge-series bg-purple-500/20 text-purple-600 dark:text-purple-400'}`}>
                  {type}
                </span>
                {imdbRating && (
                  <div className="badge badge-imdb flex items-center gap-1.5 font-medium">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{imdbRating.toFixed(1)} IMDb</span>
                  </div>
                )}
                {runtime ? (
                  <span className="text-sm text-[var(--text-secondary)]">{formatRuntime(runtime)}</span>
                ) : null}
              </div>

              <div className="flex items-start justify-between gap-4">
                <h1 className="font-texturina text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] drop-shadow-md">
                  {title} {year && <span className="text-[var(--text-muted)] font-normal ml-2">({year})</span>}
                </h1>
                
                <div className="mt-2 flex-shrink-0">
                  <FavoriteButton 
                    mediaId={id} 
                    isFavorite={isFavorite} 
                    onToggle={onFavoriteToggle} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
