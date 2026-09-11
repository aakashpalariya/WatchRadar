import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Loader2, Check, Star, Globe, Tv, Film } from 'lucide-react';
import { getTMDBImageUrl } from '@/lib/utils/format';
import DatePicker from '@/components/ui/DatePicker';

interface AddToLibrarySheetProps {
  media?: any;
  isOpen?: boolean;
  open?: boolean;
  tmdbId?: number;
  title?: string;
  type?: 'MOVIE' | 'SERIES';
  posterPath?: string | null;
  year?: string;
  onClose: () => void;
  onSuccess?: (createdMedia?: any) => void;
  onAdded?: (createdMedia?: any) => void;
}

const LANGUAGE_OPTIONS = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam',
  'Kannada', 'Bengali', 'Marathi', 'Punjabi', 'Spanish',
  'French', 'Japanese', 'Korean', 'German', 'Italian',
  'Russian', 'Portuguese', 'Other',
];

const STATUS_OPTIONS = [
  { value: 'WANT_TO_WATCH', label: 'Want to Watch' },
  { value: 'WATCHING', label: 'Currently Watching' },
  { value: 'WATCHED', label: 'Watched' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DROPPED', label: 'Dropped' },
];

interface Platform {
  id: string;
  name: string;
  color?: string | null;
}

function autoMatchPlatformIds(discoveredNames: string[], userPlatforms: Platform[]): string[] {
  if (!discoveredNames || discoveredNames.length === 0 || !userPlatforms || userPlatforms.length === 0) {
    return [];
  }
  const matchedIds: string[] = [];
  for (const discName of discoveredNames) {
    const discLower = discName.toLowerCase();
    for (const plat of userPlatforms) {
      const platLower = plat.name.toLowerCase();
      if (
        discLower.includes(platLower) ||
        platLower.includes(discLower) ||
        (discLower.includes('netflix') && platLower.includes('netflix')) ||
        (discLower.includes('prime') && platLower.includes('prime')) ||
        (discLower.includes('disney') && platLower.includes('disney')) ||
        (discLower.includes('apple') && platLower.includes('apple')) ||
        (discLower.includes('jio') && platLower.includes('jio')) ||
        (discLower.includes('sony') && platLower.includes('sony')) ||
        (discLower.includes('zee') && platLower.includes('zee')) ||
        (discLower.includes('hotstar') && platLower.includes('hotstar'))
      ) {
        if (!matchedIds.includes(plat.id)) {
          matchedIds.push(plat.id);
        }
      }
    }
  }
  return matchedIds;
}

export function AddToLibrarySheet({
  media,
  isOpen,
  open,
  tmdbId,
  title,
  type,
  posterPath,
  year,
  onClose,
  onSuccess,
  onAdded,
}: AddToLibrarySheetProps) {
  const isSheetOpen = isOpen ?? open ?? false;
  const itemTmdbId = tmdbId ?? media?.tmdbId ?? media?.id;
  const itemTitle = title ?? media?.title ?? media?.name ?? '';
  const itemType = type ?? media?.type ?? (media?.media_type === 'tv' ? 'SERIES' : 'MOVIE');
  const itemPosterPath = posterPath ?? media?.posterPath ?? media?.poster_path;
  const itemYear = year ?? (media?.releaseDate || media?.firstAirDate || media?.release_date || media?.first_air_date || '').substring(0, 4);
  const handleAdded = onSuccess ?? onAdded ?? (() => {});

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState('UNASSIGNED');
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [audioLanguages, setAudioLanguages] = useState<string[]>([]);
  const [subtitleLanguages, setSubtitleLanguages] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notes, setNotes] = useState('');
  const [watchedDate, setWatchedDate] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [tmdbDetails, setTmdbDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isSheetOpen && itemTmdbId) {
      setStatus('UNASSIGNED');
      setPlatformIds([]);
      setAudioLanguages([]);
      setSubtitleLanguages([]);
      setIsFavorite(false);
      setNotes('');
      setSuccess(false);
      setError('');
      setTmdbDetails(null);
      setIsLoadingDetails(true);

      Promise.all([
        fetch(`/api/tmdb/details?tmdbId=${itemTmdbId}&type=${itemType}`).then((r) => r.json()),
        fetch('/api/platforms').then((r) => r.json()),
      ])
        .then(([details, platData]) => {
          const userPlats: Platform[] = Array.isArray(platData) ? platData : (platData.platforms ?? []);
          setPlatforms(userPlats);

          if (!details.error) {
            setTmdbDetails(details);

            // Pre-select spoken & dubbed audio languages
            const combinedLangs = Array.from(
              new Set([
                ...(details.spokenLanguages || []),
                ...(details.dubbedLanguages || []),
              ])
            );
            if (combinedLangs.length > 0) {
              setAudioLanguages(combinedLangs);
            }

            // Auto pre-select matching streaming platforms (e.g. Netflix, Prime Video)
            if (details.streamingPlatforms && details.streamingPlatforms.length > 0) {
              const matchedIds = autoMatchPlatformIds(details.streamingPlatforms, userPlats);
              if (matchedIds.length > 0) {
                setPlatformIds(matchedIds);
              }
            }
          }
        })
        .catch((err) => {
          console.error('Failed loading options details:', err);
        })
        .finally(() => setIsLoadingDetails(false));
    }
  }, [isSheetOpen, itemTmdbId, itemType]);

  const toggleItem = (list: string[], item: string, setList: (v: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: Number(itemTmdbId),
          title: itemTitle,
          posterPath: itemPosterPath,
          type: itemType,
          status,
          platformIds,
          audioLanguages,
          subtitleLanguages,
          isFavorite,
          notes,
          imdbRating: tmdbDetails?.imdbRating ?? null,
          genres: tmdbDetails?.genres || media?.genres || [],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to add to library');
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        handleAdded(json);
        onClose();
      }, 800);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSheetOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in font-[var(--font-texturina)]">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      {/* Centered Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${itemTitle} to library`}
        className="relative z-[100000] w-full max-w-lg max-h-[85vh] flex flex-col bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--bg-card)] flex-shrink-0">
          {itemPosterPath && (
            <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border)] bg-[var(--bg-elevated)]">
              <Image
                src={getTMDBImageUrl(itemPosterPath, 'w185') ?? ''}
                alt={itemTitle}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-[var(--text-primary)] leading-snug truncate">
              {itemTitle}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-[var(--text-muted)]">
                {itemType === 'MOVIE' ? 'Movie' : 'Series'} · {itemYear}
              </span>

              {/* IMDb Rating Badge */}
              {isLoadingDetails ? (
                <span className="text-xs text-[var(--accent)] animate-pulse flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Loading ratings...
                </span>
              ) : tmdbDetails?.imdbRating ? (
                <span className="badge badge-imdb inline-flex items-center gap-1">
                  <Star size={12} fill="currentColor" color="currentColor" /> {tmdbDetails.imdbRating.toFixed(1)} IMDb
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">Rating N/A</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-5">
          {/* Success state */}
          {success && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center text-green-500 shadow-lg shadow-green-500/20">
                <Check size={32} />
              </div>
              <p className="font-bold text-base text-[var(--text-primary)]">Added to WatchRadar! 🎬</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Overview / Storyline Preview */}
              {tmdbDetails?.overview && (
                <div className="p-3.5 bg-[var(--bg-muted)] rounded-xl border border-[var(--border)]">
                  <label className="form-label mb-1">Synopsis</label>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    {tmdbDetails.overview}
                  </p>
                </div>
              )}

              {/* TMDB Discovered Streaming Platforms */}
              {tmdbDetails?.streamingPlatforms && tmdbDetails.streamingPlatforms.length > 0 && (
                <div>
                  <label className="form-label mb-2">
                    Where to Watch (Stream Available)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {tmdbDetails.streamingPlatforms.map((pName: string) => (
                      <span
                        key={pName}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/15 text-[var(--accent)] border border-purple-500/30 inline-flex items-center gap-1"
                      >
                        ✓ {pName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="form-label mb-2">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(status === opt.value ? 'UNASSIGNED' : opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        status === opt.value
                          ? 'bg-purple-500/20 text-[var(--accent)] border-[var(--accent)] shadow-sm'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Date Watched Picker */}
              <div>
                <DatePicker
                  label="Date Watched (Optional)"
                  value={watchedDate}
                  onChange={(d) => setWatchedDate(d)}
                  placeholder="Select date watched..."
                />
              </div>

              {/* Platforms */}
              {platforms.length > 0 && (
                <div>
                  <label className="form-label mb-2">Available On</label>
                  <div className="flex flex-wrap gap-1.5">
                    {platforms.map((p) => {
                      const isSel = platformIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleItem(platformIds, p.id, setPlatformIds)}
                          style={{
                            backgroundColor: isSel ? `${p.color || '#a855f7'}20` : 'var(--bg-elevated)',
                            color: isSel ? p.color || 'var(--accent)' : 'var(--text-muted)',
                            borderColor: isSel ? `${p.color || '#a855f7'}50` : 'var(--border)',
                          }}
                          className="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
                        >
                          {isSel ? '✓ ' : ''}{p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Audio Languages */}
              <div>
                <label className="form-label mb-2">Audio Languages</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSel = audioLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleItem(audioLanguages, lang, setAudioLanguages)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isSel
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtitle Languages */}
              <div>
                <label className="form-label mb-2">Subtitle Languages</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSel = subtitleLanguages.includes(lang);
                    return (
                      <button
                        key={`sub-${lang}`}
                        type="button"
                        onClick={() => toggleItem(subtitleLanguages, lang, setSubtitleLanguages)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isSel
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorite Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFavorite}
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`w-12 h-7 rounded-full transition-colors relative border border-transparent ${
                    isFavorite ? 'bg-[var(--accent)]' : 'bg-[var(--bg-muted)]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${
                      isFavorite ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Add to Favorites ❤️
                </span>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="add-notes" className="form-label">
                  Notes (optional)
                </label>
                <textarea
                  id="add-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Why you want to watch this..."
                  className="textarea"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full shadow-lg shadow-purple-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Adding...
                  </>
                ) : (
                  '+ Add to WatchRadar'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AddToLibrarySheet;
