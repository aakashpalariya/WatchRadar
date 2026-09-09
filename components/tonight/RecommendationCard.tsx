import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock } from 'lucide-react';
import { getTMDBImageUrl, formatRuntime } from '@/lib/utils/format';

interface MediaItem {
  id: string;
  title: string;
  type: 'MOVIE' | 'SERIES';
  backdropPath: string | null;
  releaseDate: string | null;
  runtime: number | null;
  imdbRating: number | null;
  genres: string[];
}

interface RecommendationCardProps {
  media: MediaItem;
  isTopPick?: boolean;
}

export default function RecommendationCard({ media, isTopPick }: RecommendationCardProps) {
  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : '';
  const backdropUrl = media.backdropPath ? getTMDBImageUrl(media.backdropPath, 'w1280') : null;

  return (
    <div className="card relative w-full rounded-2xl overflow-hidden bg-[var(--bg-muted)] border border-[var(--border)] animate-slide-up group">
      
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={media.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={isTopPick}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-muted)]" />
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent sm:bg-gradient-to-r sm:from-[#09090b]/95 sm:via-[#09090b]/80 sm:to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end p-6 sm:p-8 h-full min-h-[400px]">
        {isTopPick && (
          <div className="mb-4 inline-flex">
            <span className="bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              Tonight's Pick 🍿
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`badge uppercase font-bold tracking-wider ${media.type === 'MOVIE' ? 'badge-movie bg-blue-500/30 text-blue-300' : 'badge-series bg-purple-500/30 text-purple-300'}`}>
            {media.type}
          </span>
          {year && <span className="text-sm font-medium text-gray-300">{year}</span>}
          {media.runtime && (
            <span className="text-sm font-medium text-gray-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {formatRuntime(media.runtime)}
            </span>
          )}
        </div>

        <h2 className="font-texturina text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg leading-tight line-clamp-2">
          {media.title}
        </h2>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          {media.imdbRating && (
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[var(--imdb-gold)] font-medium text-sm">
              <Star className="w-4 h-4 fill-current" />
              <span>{media.imdbRating.toFixed(1)} IMDb</span>
            </div>
          )}
          {media.genres.length > 0 && (
            <div className="text-sm text-gray-300 truncate max-w-[200px] sm:max-w-none">
              {media.genres.slice(0, 3).join(' • ')}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center gap-3">
          <Link href={`/library/${media.id}`} className="btn btn-primary shadow-lg shadow-purple-500/20">
            View Details
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-xs text-gray-200">
            Available on Netflix ✓
          </div>
        </div>
      </div>
    </div>
  );
}
