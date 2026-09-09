import Image from 'next/image';
import { Plus, Check, Star, Loader2, Trash2 } from 'lucide-react';
import { getTMDBImageUrl } from '@/lib/utils/format';

interface SearchResultCardProps {
  media?: any;
  tmdbId?: number;
  title?: string;
  type?: 'MOVIE' | 'SERIES';
  year?: string;
  overview?: string;
  posterPath?: string | null;
  genres?: string[];
  alreadyInLibrary?: boolean;
  onAdd?: (tmdbId: number, type: string) => void;
  onQuickAdd?: (item: any) => void;
  onRemove?: (item: any) => void;
  imdbRating?: number | null;
  isLoading?: boolean;
}

export function SearchResultCard(props: SearchResultCardProps) {
  const {
    media,
    tmdbId = media?.tmdbId ?? media?.id,
    title = media?.title ?? media?.name ?? 'Untitled',
    type = media?.type ?? (media?.media_type === 'tv' ? 'SERIES' : 'MOVIE'),
    year = media?.year ?? (media?.release_date || media?.first_air_date || '').substring(0, 4),
    overview = media?.overview,
    posterPath = media?.posterPath ?? media?.poster_path,
    genres = media?.genres ?? [],
    alreadyInLibrary = media?.alreadyInLibrary ?? false,
    onAdd,
    onQuickAdd,
    onRemove,
    imdbRating = media?.imdbRating,
    isLoading = false,
  } = props;

  const handlePrimaryClick = () => {
    if (onQuickAdd) {
      onQuickAdd(media || { tmdbId, title, type, posterPath });
    } else if (onAdd) {
      onAdd(Number(tmdbId) || 0, type || 'MOVIE');
    }
  };

  return (
    <div className="card flex flex-row p-3 gap-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] animate-fade-in hover:bg-[var(--bg-elevated)] transition-colors">
      <div className="relative w-24 h-36 flex-shrink-0 bg-[var(--bg-muted)] rounded-md overflow-hidden">
        {posterPath ? (
          <Image
            src={getTMDBImageUrl(posterPath, 'w500') || ''}
            alt={title}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs text-center p-1">
            No Poster
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow py-1 overflow-hidden">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-texturina font-bold text-lg text-[var(--text-primary)] truncate" title={title}>
            {title}
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${type === 'MOVIE' ? 'badge-movie bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'badge-series bg-purple-500/20 text-purple-600 dark:text-purple-400'}`}>
            {type}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-2">
          <span>{year}</span>
          {imdbRating && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-[var(--imdb-gold)] font-medium">
                <Star className="w-3 h-3 fill-current" /> {imdbRating.toFixed(1)}
              </span>
            </>
          )}
          {genres.length > 0 && (
            <>
              <span>•</span>
              <span className="truncate">{genres.slice(0, 2).join(', ')}</span>
            </>
          )}
        </div>

        <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3 flex-grow">
          {overview || 'No overview available.'}
        </p>

        <div className="mt-auto flex justify-end gap-2 items-center">
          {alreadyInLibrary ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-green-500 text-xs font-semibold px-3 py-1.5 bg-green-500/10 rounded-xl border border-green-500/20">
                <Check className="w-3.5 h-3.5" /> In Library ✓
              </div>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(media || { tmdbId, title, type })}
                  title="Remove from WatchRadar"
                  className="btn btn-danger btn-sm flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePrimaryClick}
                disabled={isLoading}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add to WatchRadar
                  </>
                )}
              </button>

              {onAdd && onQuickAdd && (
                <button
                  type="button"
                  onClick={() => onAdd(Number(tmdbId) || 0, type || 'MOVIE')}
                  title="Customize status, platforms, and languages"
                  className="btn btn-secondary btn-sm"
                >
                  Options
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
