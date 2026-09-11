'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Star, Heart, Trash2, Loader2, Globe, Tv, Check, AlertTriangle, AlertCircle, X, FolderHeart, Plus, FolderPlus } from 'lucide-react';
import RatingInput from '@/components/shared/RatingInput';
import DatePicker from '@/components/ui/DatePicker';
import { saveMediaOverride, getMediaOverride } from '@/lib/utils/storage';

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

interface MediaDetailEditorProps {
  mediaId: string;
  initialStatus: string;
  initialMyRating: number | null;
  initialIsFavorite: boolean;
  initialNotes: string | null;
  initialAudioLanguages: string[];
  initialSubtitleLanguages: string[];
  initialPlatformIds: string[];
  allPlatforms: Platform[];
  initialWatchedAt?: string | null;
}

export function MediaDetailEditor({
  mediaId,
  initialStatus,
  initialMyRating,
  initialIsFavorite,
  initialNotes,
  initialAudioLanguages,
  initialSubtitleLanguages,
  initialPlatformIds,
  allPlatforms,
  initialWatchedAt,
}: MediaDetailEditorProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [myRating, setMyRating] = useState<number | null>(initialMyRating);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [notes, setNotes] = useState(initialNotes || '');
  const [audioLanguages, setAudioLanguages] = useState<string[]>(initialAudioLanguages);
  const [subtitleLanguages, setSubtitleLanguages] = useState<string[]>(initialSubtitleLanguages);
  const [platformIds, setPlatformIds] = useState<string[]>(initialPlatformIds);
  const [watchedDate, setWatchedDate] = useState<string>(
    initialWatchedAt
      ? new Date(initialWatchedAt).toISOString().split('T')[0]
      : (initialStatus === 'WATCHED' ? new Date().toISOString().split('T')[0] : '')
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState('');

  // Hydrate from localStorage on client mount
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined' || !mediaId) return;

    const override = getMediaOverride(mediaId);
    if (override) {
      if (override.status !== undefined) setStatus(override.status);
      if (override.myRating !== undefined) setMyRating(override.myRating);
      if (override.isFavorite !== undefined) setIsFavorite(override.isFavorite);
      if (override.notes !== undefined && override.notes !== null) setNotes(override.notes);
      if (override.audioLanguages) setAudioLanguages(override.audioLanguages);
      if (override.subtitleLanguages) setSubtitleLanguages(override.subtitleLanguages);
      if (override.platformIds) setPlatformIds(override.platformIds);
      if (override.watchedAt !== undefined) {
        setWatchedDate(override.watchedAt ? new Date(override.watchedAt).toISOString().split('T')[0] : '');
      }
    }
  }, [mediaId]);

  // Add to Collection modal state
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionsList, setCollectionsList] = useState<any[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [togglingCollectionId, setTogglingCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionError, setNewCollectionError] = useState('');
  const [isCreatingCol, setIsCreatingCol] = useState(false);
  const [colToastMsg, setColToastMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCollections = async () => {
    setIsLoadingCollections(true);
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollectionsList(Array.isArray(data) ? data : data.collections || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleOpenCollectionModal = () => {
    setShowCollectionModal(true);
    fetchCollections();
  };

  const handleToggleCollection = async (colId: string, isInCol: boolean) => {
    setTogglingCollectionId(colId);
    try {
      const res = await fetch(`/api/collections/${colId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isInCol ? 'remove' : 'add', mediaId }),
      });
      if (res.ok) {
        setCollectionsList((prev) =>
          prev.map((c) => {
            if (c.id === colId) {
              const newMediaIds = isInCol
                ? (c.mediaIds || []).filter((id: string) => id !== mediaId)
                : [...(c.mediaIds || []), mediaId];
              return {
                ...c,
                mediaIds: newMediaIds,
                itemCount: isInCol ? Math.max(0, c.itemCount - 1) : c.itemCount + 1,
              };
            }
            return c;
          })
        );
        setColToastMsg(isInCol ? 'Removed from collection' : 'Added to collection 📁');
        setTimeout(() => setColToastMsg(''), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingCollectionId(null);
    }
  };

  const handleCreateAndAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewCollectionError('');
    if (!newCollectionName.trim()) {
      setNewCollectionError('Collection name is required');
      return;
    }

    setIsCreatingCol(true);
    try {
      const createRes = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });

      const newCol = await createRes.json();
      if (!createRes.ok) {
        setNewCollectionError(newCol.error || 'Failed to create collection');
        return;
      }

      await fetch(`/api/collections/${newCol.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', mediaId }),
      });

      setNewCollectionName('');
      setNewCollectionError('');
      fetchCollections();
      setColToastMsg(`Created & added to "${newCol.name}" 🎬`);
      setTimeout(() => setColToastMsg(''), 2500);
    } catch (err) {
      console.error(err);
      setNewCollectionError('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreatingCol(false);
    }
  };

  const autoSave = async (overrideData?: Partial<{
    status: string;
    myRating: number | null;
    isFavorite: boolean;
    notes: string;
    audioLanguages: string[];
    subtitleLanguages: string[];
    platformIds: string[];
    watchedAt: string | null;
  }>) => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    const payload = {
      status: overrideData?.status !== undefined ? overrideData.status : status,
      myRating: overrideData?.myRating !== undefined ? overrideData.myRating : myRating,
      isFavorite: overrideData?.isFavorite !== undefined ? overrideData.isFavorite : isFavorite,
      notes: overrideData?.notes !== undefined ? overrideData.notes : notes,
      audioLanguages: overrideData?.audioLanguages !== undefined ? overrideData.audioLanguages : audioLanguages,
      subtitleLanguages: overrideData?.subtitleLanguages !== undefined ? overrideData.subtitleLanguages : subtitleLanguages,
      platformIds: overrideData?.platformIds !== undefined ? overrideData.platformIds : platformIds,
      watchedAt: overrideData?.watchedAt !== undefined ? overrideData.watchedAt : (watchedDate || null),
    };

    // Save to localStorage immediately so changes persist on frontend
    saveMediaOverride(mediaId, payload);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    try {
      await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      router.refresh();
    } catch {
      // Silently ignore server DB errors since client localStorage has persisted
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    let newWatchedDate = watchedDate;
    if (newStatus === 'WATCHED') {
      if (!newWatchedDate) {
        newWatchedDate = new Date().toISOString().split('T')[0];
        setWatchedDate(newWatchedDate);
      }
    } else {
      newWatchedDate = '';
      setWatchedDate('');
    }
    autoSave({ status: newStatus, watchedAt: newWatchedDate || null });
  };

  const handleWatchedDateChange = (newDate: string) => {
    setWatchedDate(newDate);
    const newStatus = newDate ? 'WATCHED' : status;
    if (newDate && status !== 'WATCHED') {
      setStatus('WATCHED');
    }
    autoSave({ status: newStatus, watchedAt: newDate || null });
  };

  const handleRatingChange = (newRating: number) => {
    setMyRating(newRating);
    autoSave({ myRating: newRating });
  };

  const handleFavoriteToggle = () => {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);
    autoSave({ isFavorite: nextFav });
  };

  const toggleAudioLang = (lang: string) => {
    const nextList = audioLanguages.includes(lang)
      ? audioLanguages.filter((l) => l !== lang)
      : [...audioLanguages, lang];
    setAudioLanguages(nextList);
    autoSave({ audioLanguages: nextList });
  };

  const toggleSubLang = (lang: string) => {
    const nextList = subtitleLanguages.includes(lang)
      ? subtitleLanguages.filter((l) => l !== lang)
      : [...subtitleLanguages, lang];
    setSubtitleLanguages(nextList);
    autoSave({ subtitleLanguages: nextList });
  };

  const togglePlatform = (pid: string) => {
    const nextList = platformIds.includes(pid)
      ? platformIds.filter((p) => p !== pid)
      : [...platformIds, pid];
    setPlatformIds(nextList);
    autoSave({ platformIds: nextList });
  };

  const handleNotesBlur = () => {
    if (notes !== (initialNotes || '')) {
      autoSave({ notes });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to delete title');
        setIsDeleting(false);
        setShowConfirmModal(false);
        return;
      }

      router.push('/library');
      router.refresh();
    } catch {
      setError('Network error deleting media');
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Auto-Save Status Indicator */}
      <div className="flex items-center justify-between">
        {error ? (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        ) : (
          <div className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-2">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-[var(--accent)] font-bold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving changes...
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-1.5 text-green-400 font-bold animate-fade-in">
                <Check className="w-3.5 h-3.5" /> All changes auto-saved ✓
              </span>
            ) : (
              <span className="opacity-70">✨ Auto-saves automatically on change</span>
            )}
          </div>
        )}
      </div>

      {/* Watch Status Section */}
      <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Watch Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  status === opt.value
                    ? 'bg-purple-500/20 text-[var(--accent)] border-[var(--accent)] shadow-sm shadow-purple-500/20'
                    : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Watched Picker */}
        <div className="pt-3 border-t border-[var(--border)]">
          <DatePicker
            label="Date Watched / Completed"
            value={watchedDate}
            onChange={(d) => handleWatchedDateChange(d)}
            placeholder="Select date watched..."
          />
        </div>
      </section>

      {/* Custom Audio & Dubbed Languages */}
      <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-blue-400" /> Audio & Dubbed Languages
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Select all spoken & dubbed audio tracks available for this title:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSel = audioLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleAudioLang(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    isSel
                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40'
                      : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)] hover:border-black/20 dark:hover:border-white/20'
                  }`}
                >
                  {isSel ? '✓ ' : ''}{lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtitle Languages */}
        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-purple-400" /> Subtitle Languages
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSel = subtitleLanguages.includes(lang);
              return (
                <button
                  key={`sub-${lang}`}
                  type="button"
                  onClick={() => toggleSubLang(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    isSel
                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40'
                      : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)] hover:border-black/20 dark:hover:border-white/20'
                  }`}
                >
                  {isSel ? '✓ ' : ''}{lang}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Streaming Platforms */}
      {allPlatforms.length > 0 && (
        <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-[var(--accent)]" /> Streaming Platforms
          </h3>
          <div className="flex flex-wrap gap-2">
            {allPlatforms.map((p) => {
              const isSel = platformIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  style={{
                    backgroundColor: isSel ? `${p.color || '#a855f7'}25` : 'transparent',
                    color: isSel ? p.color || 'var(--accent)' : 'var(--text-muted)',
                    borderColor: isSel ? `${p.color || '#a855f7'}60` : 'var(--border)',
                  }}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>{isSel ? '✓' : '+'}</span> {p.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Personal Rating & Favorite */}
      <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-purple-400" /> Personal Rating (1-10 Stars)
          </h3>
          <RatingInput value={myRating} onChange={handleRatingChange} />
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4 flex-wrap">
          <button
            type="button"
            onClick={handleFavoriteToggle}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
              isFavorite
                ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm shadow-red-500/20'
                : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400' : ''}`} />
            {isFavorite ? 'In Favorites ❤️' : 'Add to Favorites'}
          </button>

          <button
            type="button"
            onClick={handleOpenCollectionModal}
            className="p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all bg-[var(--bg-muted)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] shadow-sm cursor-pointer"
          >
            <FolderHeart className="w-4 h-4 text-amber-400" />
            Add to Collection
          </button>
        </div>
      </section>

      {/* Personal Notes */}
      <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Personal Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={3}
          placeholder="Add notes about your watch experience, favorite dubbed tracks, etc..."
          className="input w-full p-3 text-xs bg-[var(--bg-muted)] rounded-xl border border-[var(--border)] text-[var(--text-primary)] resize-vertical focus:outline-none focus:border-[var(--accent)]"
        />
      </section>

      {/* Remove from WatchRadar Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className="w-full sm:w-auto px-5 py-3 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Trash2 className="w-4 h-4" /> Remove from WatchRadar
        </button>
      </div>

      {/* Confirmation Modal via React Portal (centered in screen viewport) */}
      {showConfirmModal && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-[var(--font-texturina)]">
          <div className="bg-[var(--bg-surface)] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative animate-slide-up text-[var(--text-primary)]">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 flex-shrink-0 shadow-lg shadow-red-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg tracking-tight text-[var(--text-primary)]">
                  Remove from Library?
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Confirm title removal</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to remove this title from WatchRadar? All associated watch history, personal ratings, dubbed audio choices, and notes will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] transition-colors border border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors border border-red-500 shadow-md shadow-red-600/30 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Remove Title
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add to Collection Modal via React Portal */}
      {showCollectionModal && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-[var(--font-texturina)]">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4 relative animate-slide-up text-[var(--text-primary)]">
            <button
              type="button"
              onClick={() => setShowCollectionModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <FolderHeart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                  Add to Collection
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Select collection folders to organize this title</p>
              </div>
            </div>

            {colToastMsg && (
              <div className="p-2.5 bg-green-500/15 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4" /> {colToastMsg}
              </div>
            )}

            {/* Collections List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {isLoadingCollections ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" /> Loading your collections...
                </div>
              ) : collectionsList.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                  You don't have any collection folders yet. Create one below!
                </div>
              ) : (
                collectionsList.map((col) => {
                  const isInCol = Boolean(col.mediaIds && col.mediaIds.includes(mediaId));
                  const isToggling = togglingCollectionId === col.id;

                  return (
                    <div
                      key={col.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/40 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-amber-400 flex-shrink-0">
                          <FolderHeart className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm truncate text-[var(--text-primary)]">
                            {col.name}
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {col.itemCount || 0} {col.itemCount === 1 ? 'title' : 'titles'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCollection(col.id, isInCol)}
                        disabled={isToggling}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all flex-shrink-0 cursor-pointer ${
                          isInCol
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'btn btn-primary btn-sm'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isInCol ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Create New Collection */}
            <form onSubmit={handleCreateAndAddCollection} className="pt-3 border-t border-[var(--border)] space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Create New Collection Folder
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => {
                    setNewCollectionName(e.target.value);
                    if (e.target.value.trim()) setNewCollectionError('');
                  }}
                  placeholder="e.g. Director's Cut / Epic Sagas"
                  className={`input py-2 text-xs flex-1 ${newCollectionError ? 'input-error border-red-500' : ''}`}
                  style={newCollectionError ? { borderColor: '#ef4444' } : undefined}
                />
                <button
                  type="submit"
                  disabled={isCreatingCol}
                  className="btn btn-secondary btn-sm flex items-center gap-1 font-bold flex-shrink-0"
                >
                  {isCreatingCol ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  Create
                </button>
              </div>
              {newCollectionError && (
                <p className="text-[11px] mt-1 flex items-center gap-1 font-semibold" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} /> {newCollectionError}
                </p>
              )}
            </form>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCollectionModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-white/10"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
