'use client';

import { useState, useEffect } from 'react';
import { Play, Check, Clock, Sparkles, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveMediaOverride, getMediaOverride } from '@/lib/utils/storage';
import DatePicker from '@/components/ui/DatePicker';

interface MovieProgressTrackerProps {
  mediaId: string;
  initialProgress: number;
  runtime?: number | null;
  initialStatus: string;
  initialWatchedAt?: string | null;
}

export default function MovieProgressTracker({
  mediaId,
  initialProgress,
  runtime,
  initialStatus,
  initialWatchedAt,
}: MovieProgressTrackerProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(initialProgress || (initialStatus === 'WATCHED' ? 100 : 0));
  const [watchedDate, setWatchedDate] = useState<string>(
    initialWatchedAt ? new Date(initialWatchedAt).toISOString().split('T')[0] : (initialStatus === 'WATCHED' ? new Date().toISOString().split('T')[0] : '')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mediaId) return;
    const override = getMediaOverride(mediaId);
    if (override) {
      if (override.progressPercentage !== undefined) {
        setProgress(override.progressPercentage);
      }
      if (override.watchedAt !== undefined && override.watchedAt !== null) {
        setWatchedDate(override.watchedAt);
      }
    }
  }, [mediaId]);

  const saveProgress = async (newProgress: number, customWatchedDate?: string) => {
    setProgress(newProgress);
    setIsSaving(true);
    setSaveSuccess(false);

    let nextWatchedDate = customWatchedDate !== undefined ? customWatchedDate : watchedDate;
    if (newProgress >= 100) {
      if (!nextWatchedDate) {
        nextWatchedDate = new Date().toISOString().split('T')[0];
        setWatchedDate(nextWatchedDate);
      }
    } else {
      nextWatchedDate = '';
      setWatchedDate('');
    }

    const calcStatus = newProgress >= 100 ? 'WATCHED' : newProgress > 0 ? 'WATCHING' : 'WANT_TO_WATCH';
    saveMediaOverride(mediaId, {
      progressPercentage: newProgress,
      status: calcStatus,
      watchedEpisodes: newProgress >= 100 ? 1 : 0,
      watchedAt: nextWatchedDate || null,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    try {
      await fetch(`/api/media/${mediaId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressPercentage: newProgress,
          watchedAt: nextWatchedDate || null,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to save movie progress:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (newDateStr: string) => {
    setWatchedDate(newDateStr);
    saveProgress(progress >= 100 ? progress : 100, newDateStr);
  };

  const minutesWatched = runtime ? Math.round((progress / 100) * runtime) : null;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-texturina text-base font-bold text-[var(--text-primary)]">Movie Watch Progress</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Track how far you've watched</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-500/15 px-2.5 py-1 rounded-full border border-green-500/30 animate-fade-in flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          <span className="text-sm font-extrabold text-[var(--accent)] bg-purple-500/15 px-3 py-1 rounded-xl border border-purple-500/30 shadow-sm">
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Bar & Slider */}
      <div className="space-y-3 my-4">
        <div className="relative w-full h-3 bg-[var(--bg-muted)] rounded-full overflow-hidden p-0.5 border border-purple-500/20 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-[var(--accent)] transition-all duration-300 shadow-md shadow-purple-500/30"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          onMouseUp={(e) => saveProgress(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => saveProgress(Number((e.target as HTMLInputElement).value))}
          className="range-slider w-full cursor-pointer"
        />
      </div>

      {/* Minutes Watched Indicator if runtime available */}
      {runtime && runtime > 0 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-3 py-2 rounded-xl mb-4 border border-[var(--border)]">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Time Watched:
          </span>
          <span className="font-bold text-[var(--text-primary)]">
            {minutesWatched} / {runtime} min
          </span>
        </div>
      )}

      {/* Quick Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        {[
          { label: '0% (Unwatched)', val: 0 },
          { label: '25%', val: 25 },
          { label: '50% (Halfway)', val: 50 },
          { label: '75%', val: 75 },
          { label: '100% (Watched ✓)', val: 100 },
        ].map((preset) => (
          <button
            key={preset.val}
            type="button"
            onClick={() => saveProgress(preset.val)}
            disabled={isSaving}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center justify-center gap-1 ${
              progress === preset.val
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md shadow-purple-500/30 scale-[1.02]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            {preset.val === 100 && <Sparkles className="w-3 h-3 text-amber-400 dark:text-yellow-300" />}
            {preset.label}
          </button>
        ))}
      </div>

      {/* Date Watched Picker when 100% Watched */}
      {progress >= 100 && (
        <div className="mt-4 pt-3 border-t border-[var(--border)] animate-fade-in">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <DatePicker
                label="Date Watched"
                value={watchedDate}
                onChange={(d) => handleDateChange(d)}
                placeholder="Select date watched..."
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] self-end pb-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" /> Auto-filled today's date. Click to change.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
