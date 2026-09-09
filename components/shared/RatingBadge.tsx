import { Star } from 'lucide-react';

interface RatingBadgeProps {
  rating: number | null;
  type: 'imdb' | 'personal';
  size?: 'sm' | 'md';
}

export default function RatingBadge({ rating, type, size = 'md' }: RatingBadgeProps) {
  const isSm = size === 'sm';
  const iconSize = isSm ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = isSm ? 'text-xs' : 'text-sm';
  const padding = isSm ? 'px-1.5 py-0.5' : 'px-2 py-1';

  if (rating === null) {
    if (type === 'imdb') {
      return (
        <span className={`text-[var(--text-muted)] ${textSize} italic bg-[var(--bg-muted)] ${padding} rounded-md border border-[var(--border)] inline-block`}>
          Rating unavailable
        </span>
      );
    }
    return null;
  }

  if (type === 'imdb') {
    return (
      <div className={`inline-flex items-center gap-1.5 badge badge-imdb font-medium ${padding} ${textSize}`}>
        <Star className={`${iconSize} fill-current`} />
        <span>{rating.toFixed(1)}</span>
        <span className="opacity-80 ml-0.5">IMDb</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 font-medium ${padding} rounded-md border border-purple-500/30 ${textSize}`}>
      <Star className={`${iconSize} fill-current`} />
      <span>{rating.toFixed(1)}</span>
      <span className="opacity-80 ml-0.5">/10</span>
    </div>
  );
}
