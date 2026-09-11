'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Minus, Plus, Tv, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';
import { getEpisodeWatchedMap, saveEpisodeWatched, saveMediaOverride, getMediaOverride } from '@/lib/utils/storage';
import DatePicker from '@/components/ui/DatePicker';

interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  airDate: string | null;
  watched: boolean;
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

interface EpisodeProgressProps {
  mediaId: string;
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: number | null;
  totalEpisodes: number | null;
  watchedEpisodes: number;
  progressPercentage: number;
  seasons: Season[];
  initialWatchedAt?: string | null;
}

export default function EpisodeProgress({
  mediaId,
  currentSeason: initSeason,
  currentEpisode: initEpisode,
  totalEpisodes,
  watchedEpisodes: initWatched,
  progressPercentage: initProgress,
  seasons: initSeasons,
  initialWatchedAt,
}: EpisodeProgressProps) {
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[]>(initSeasons || []);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(initSeason || 1);
  const [currentSeason, setCurrentSeason] = useState(initSeason || 1);
  const [currentEpisode, setCurrentEpisode] = useState(initEpisode || 1);
  const [watchedCount, setWatchedCount] = useState(initWatched || 0);
  const [watchedDate, setWatchedDate] = useState<string>(
    initialWatchedAt ? new Date(initialWatchedAt).toISOString().split('T')[0] : (initProgress >= 100 ? new Date().toISOString().split('T')[0] : '')
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Hydrate from localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined' || !mediaId) return;

    const storedMap = getEpisodeWatchedMap(mediaId);
    if (Object.keys(storedMap).length > 0) {
      let calcWatched = 0;
      setSeasons((prevSeasons) =>
        prevSeasons.map((s) => ({
          ...s,
          episodes: s.episodes.map((e) => {
            const key = `S${s.seasonNumber}_E${e.episodeNumber}`;
            const isWatched = storedMap[key] !== undefined ? storedMap[key] : e.watched;
            if (isWatched) calcWatched++;
            return { ...e, watched: isWatched };
          }),
        }))
      );
      setWatchedCount(calcWatched);
    }

    const override = getMediaOverride(mediaId);
    if (override) {
      if (override.currentSeason) setCurrentSeason(override.currentSeason);
      if (override.currentEpisode) setCurrentEpisode(override.currentEpisode);
    }
  }, [mediaId]);

  const totalEps = totalEpisodes || seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 1;
  const currentProgress = Math.min(100, Math.max(0, Math.round((watchedCount / totalEps) * 100)));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  const toggleEpisode = async (seasonNum: number, episodeNum: number, currentState: boolean) => {
    const newState = !currentState;

    // Save to localStorage immediately
    saveEpisodeWatched(mediaId, seasonNum, episodeNum, newState);

    // Optimistic UI update
    let newWatchedCount = 0;
    setSeasons((prev) =>
      prev.map((s) => {
        const updatedEpisodes = s.episodes.map((e) => {
          const isW = s.seasonNumber === seasonNum && e.episodeNumber === episodeNum ? newState : e.watched;
          if (isW) newWatchedCount++;
          return { ...e, watched: isW };
        });
        return { ...s, episodes: updatedEpisodes };
      })
    );

    setWatchedCount(newWatchedCount);

    const calcProgress = Math.min(100, Math.max(0, Math.round((newWatchedCount / totalEps) * 100)));
    const newStatus = calcProgress >= 100 ? 'WATCHED' : newWatchedCount > 0 ? 'WATCHING' : 'WANT_TO_WATCH';

    let nextWatchedDate = watchedDate;
    if (calcProgress >= 100) {
      if (!nextWatchedDate) {
        nextWatchedDate = new Date().toISOString().split('T')[0];
        setWatchedDate(nextWatchedDate);
      }
    } else {
      nextWatchedDate = '';
      setWatchedDate('');
    }

    saveMediaOverride(mediaId, {
      progressPercentage: calcProgress,
      watchedEpisodes: newWatchedCount,
      currentSeason: newState ? seasonNum : currentSeason,
      currentEpisode: newState ? episodeNum : currentEpisode,
      status: newStatus,
      watchedAt: nextWatchedDate || null,
    });

    if (newState) {
      setCurrentSeason(seasonNum);
      setCurrentEpisode(episodeNum);
    }

    showToast(newState ? `S${seasonNum} E${episodeNum} marked watched ✓` : `S${seasonNum} E${episodeNum} unmarked`);

    try {
      setIsUpdating(true);
      await fetch(`/api/media/${mediaId}/episode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonNumber: seasonNum,
          episodeNumber: episodeNum,
          isWatched: newState,
          watchedAt: nextWatchedDate || null,
        }),
      });
      router.refresh();
    } catch (error) {
      console.error('Error toggling episode:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDateChange = async (newDateStr: string) => {
    setWatchedDate(newDateStr);
    saveMediaOverride(mediaId, {
      watchedAt: newDateStr,
      status: 'WATCHED',
      progressPercentage: 100,
    });
    try {
      await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchedAt: newDateStr,
          status: 'WATCHED',
        }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to save watched date:', err);
    }
  };

  const markAllEpisodesWatched = async (setAllWatched: boolean) => {
    if (isUpdating) return;
    setIsUpdating(true);
    let newCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const nextWatchedDate = setAllWatched ? (watchedDate || todayStr) : '';

    setSeasons((prev) =>
      prev.map((s) => ({
        ...s,
        episodes: s.episodes.map((e) => {
          saveEpisodeWatched(mediaId, s.seasonNumber, e.episodeNumber, setAllWatched);
          if (setAllWatched) newCount++;
          return { ...e, watched: setAllWatched };
        }),
      }))
    );

    setWatchedCount(newCount);
    setWatchedDate(nextWatchedDate);

    const calcProgress = setAllWatched ? 100 : 0;
    const newStatus = setAllWatched ? 'WATCHED' : 'WANT_TO_WATCH';

    saveMediaOverride(mediaId, {
      progressPercentage: calcProgress,
      watchedEpisodes: newCount,
      status: newStatus,
      watchedAt: nextWatchedDate || null,
    });

    showToast(setAllWatched ? 'All episodes marked watched! 🎉' : 'All episodes unmarked');

    try {
      await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          watchedAt: nextWatchedDate || null,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const markSeasonWatched = async (seasonNum: number) => {
    const season = seasons.find((s) => s.seasonNumber === seasonNum);
    if (!season) return;

    const unwatched = season.episodes.filter((e) => !e.watched);
    if (unwatched.length === 0) return;

    setIsUpdating(true);
    for (const ep of unwatched) {
      await toggleEpisode(seasonNum, ep.episodeNumber, false);
    }
    showToast(`Season ${seasonNum} marked as completed! 🎉`);
    setIsUpdating(false);
  };

  const handleQuickAdjust = async (change: number) => {
    if (isUpdating) return;

    // Find all episodes flattened in order
    const allEpisodesList: { seasonNumber: number; episodeNumber: number; watched: boolean }[] = [];
    seasons.forEach((s) => {
      s.episodes.forEach((e) => {
        allEpisodesList.push({
          seasonNumber: s.seasonNumber,
          episodeNumber: e.episodeNumber,
          watched: e.watched,
        });
      });
    });

    if (allEpisodesList.length === 0) return;

    if (change > 0) {
      // Find first unwatched episode
      const nextEp = allEpisodesList.find((e) => !e.watched);
      if (nextEp) {
        await toggleEpisode(nextEp.seasonNumber, nextEp.episodeNumber, false);
      }
    } else {
      // Find last watched episode
      const lastWatched = [...allEpisodesList].reverse().find((e) => e.watched);
      if (lastWatched) {
        await toggleEpisode(lastWatched.seasonNumber, lastWatched.episodeNumber, true);
      }
    }
  };

  return (
    <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Header section */}
      <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-gradient-to-r from-purple-500/10 via-[var(--bg-card)] to-indigo-500/10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-texturina text-base font-bold text-[var(--text-primary)]">Series Episode Progress</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Check off watched episodes to save your progress</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {toastMsg && (
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/30 animate-fade-in flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" /> {toastMsg}
              </span>
            )}
            
            {/* Mark All Complete Button */}
            <button
              type="button"
              onClick={() => markAllEpisodesWatched(currentProgress < 100)}
              disabled={isUpdating}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                currentProgress >= 100
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'
              }`}
              title={currentProgress >= 100 ? 'Mark all episodes as unwatched' : 'Mark all episodes as watched'}
            >
              <Check className="w-3.5 h-3.5" />
              {currentProgress >= 100 ? 'All Completed ✓' : 'Mark All Complete'}
            </button>

            {/* Stepper Controls */}
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => handleQuickAdjust(-1)}
                disabled={isUpdating || watchedCount === 0}
                className="p-1.5 hover:bg-[var(--accent)]/15 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors disabled:opacity-30"
                title="Mark previous episode as unwatched"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-extrabold px-2.5 text-[var(--text-primary)]">
                S{currentSeason.toString().padStart(2, '0')} · E{currentEpisode.toString().padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => handleQuickAdjust(1)}
                disabled={isUpdating || watchedCount >= totalEps}
                className="p-1.5 hover:bg-[var(--accent)]/15 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors disabled:opacity-30"
                title="Mark next episode as watched"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>{watchedCount} / {totalEps} Episodes Watched</span>
            <span className="text-[var(--accent)] font-extrabold">{currentProgress}%</span>
          </div>
          <div className="h-2.5 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden p-0.5 border border-purple-500/20 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-[var(--accent)] transition-all duration-500 shadow-md shadow-purple-500/40"
              style={{ width: `${Math.max(currentProgress, 2)}%` }}
            />
          </div>
        </div>

        {/* Date Watched Picker when All Episodes Complete */}
        {currentProgress >= 100 && (
          <div className="mt-4 pt-3 border-t border-[var(--border)] animate-fade-in">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <DatePicker
                  label="Date Series Completed"
                  value={watchedDate}
                  onChange={(d) => handleDateChange(d)}
                  placeholder="Select completion date..."
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] self-end pb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" /> Auto-filled today's date. Click to change.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Season Accordions */}
      <div className="divide-y divide-[var(--border)]">
        {seasons.map((season) => {
          const isExpanded = expandedSeason === season.seasonNumber;
          const watchedInSeason = season.episodes.filter((e) => e.watched).length;
          const totalInSeason = season.episodes.length;
          const isComplete = watchedInSeason === totalInSeason && totalInSeason > 0;

          return (
            <div key={season.seasonNumber} className="bg-[var(--bg-card)]">
              <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors">
                <button
                  type="button"
                  onClick={() => setExpandedSeason(isExpanded ? null : season.seasonNumber)}
                  className="flex items-center gap-3 text-left flex-1"
                >
                  <span className="font-bold text-sm text-[var(--text-primary)]">Season {season.seasonNumber}</span>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    ({watchedInSeason}/{totalInSeason} watched)
                  </span>
                  {isComplete && (
                    <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {!isComplete && totalInSeason > 0 && (
                    <button
                      type="button"
                      onClick={() => markSeasonWatched(season.seasonNumber)}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-300 hover:text-purple-500 bg-purple-500/15 hover:bg-purple-500/25 px-2.5 py-1 rounded-lg border border-purple-500/30 transition-all flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> All Watched
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedSeason(isExpanded ? null : season.seasonNumber)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Episode List */}
              {isExpanded && (
                <div className="px-3 pb-3 bg-[var(--bg-elevated)]/40 divide-y divide-[var(--border)]/40">
                  {season.episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="flex items-center p-2.5 gap-3 hover:bg-[var(--bg-muted)]/70 rounded-xl transition-colors group cursor-pointer"
                      onClick={() => toggleEpisode(season.seasonNumber, episode.episodeNumber, episode.watched)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEpisode(season.seasonNumber, episode.episodeNumber, episode.watched);
                        }}
                        className={cn(
                          'flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-200 shadow-sm',
                          episode.watched
                            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-400 text-white shadow-purple-500/30'
                            : 'border-[var(--border)] bg-[var(--bg-muted)] hover:border-purple-500/60 text-transparent'
                        )}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="flex flex-col flex-grow min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              'text-xs sm:text-sm truncate transition-colors',
                              episode.watched
                                ? 'text-[var(--text-secondary)] font-medium'
                                : 'text-[var(--text-primary)] font-semibold group-hover:text-[var(--accent)]'
                            )}
                          >
                            {episode.episodeNumber}. {episode.name}
                          </span>
                          {episode.watched && (
                            <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md flex items-center gap-0.5 flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Watched
                            </span>
                          )}
                        </div>
                        {episode.airDate && (
                          <span className="text-[10px] text-[var(--text-muted)] mt-0.5">{episode.airDate}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
