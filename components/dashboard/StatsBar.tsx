'use client';

import { useEffect, useState } from 'react';
import { Film, Tv, Clock, Activity } from 'lucide-react';

interface StatsData {
  watchedMovies: number;
  watchedSeries: number;
  estimatedHoursWatched: number;
  currentlyWatching: number;
}

interface StatsBarProps {
  stats?: { totalMovies?: number; totalSeries?: number; currentlyWatchingCount?: number; estimatedHoursWatched?: number } | StatsData;
}

export function StatsBar({ stats: initialStats }: StatsBarProps = {}) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(!initialStats);

  useEffect(() => {
    if (initialStats) {
      setStats({
        watchedMovies: ('watchedMovies' in initialStats ? initialStats.watchedMovies : initialStats.totalMovies) ?? 0,
        watchedSeries: ('watchedSeries' in initialStats ? initialStats.watchedSeries : initialStats.totalSeries) ?? 0,
        estimatedHoursWatched: ('estimatedHoursWatched' in initialStats ? initialStats.estimatedHoursWatched : 0) ?? 0,
        currentlyWatching: ('currentlyWatching' in initialStats ? initialStats.currentlyWatching : initialStats.currentlyWatchingCount) ?? 0,
      });
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [initialStats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    { label: 'Movies Watched', value: stats.watchedMovies ?? 0, icon: Film, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15' },
    { label: 'Series Watched', value: stats.watchedSeries ?? 0, icon: Tv, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/15' },
    { label: 'Hours Watched', value: Math.round(stats.estimatedHoursWatched ?? 0), icon: Clock, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Currently Watching', value: stats.currentlyWatching ?? 0, icon: Activity, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/15' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col hover:bg-[var(--bg-elevated)] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-md ${item.bg}`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{item.label}</span>
            </div>
            <div className="font-bold text-2xl text-[var(--text-primary)]">
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsBar;
