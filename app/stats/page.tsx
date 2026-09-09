'use client';

import { useState, useEffect } from 'react';
import {
  BarChart2,
  Tv,
  Film,
  Clock,
  Star,
  CheckCircle,
  Eye,
  Bookmark,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen pt-5 px-4 pb-28 animate-fade-in font-[var(--font-texturina)] max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      </main>
    );
  }

  const GENRE_COLORS = [
    '#a855f7', '#3b82f6', '#ec4899', '#f59e0b', '#10b981',
    '#6366f1', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4',
  ];

  const formattedMonthlyWatched = stats?.monthlyWatched?.map((item: any) => ({
    ...item,
    shortMonth: item.month ? item.month.split(' ')[0] : item.month,
  })) || [];

  return (
    <main className="min-h-screen pt-5 px-4 pb-28 animate-fade-in font-[var(--font-texturina)] text-[var(--text-primary)] max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
          <div>
            <h1 className="page-title">Watch Radar Statistics</h1>
            <p className="page-description">
              Comprehensive analytics, completed titles & watching history
            </p>
          </div>
        </div>
      </header>

      {/* 8-Card Summary Metrics Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {/* Completed Movies */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Completed Movies</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{stats?.watchedMovies || 0}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              out of {stats?.totalMovies || 0} total movies
            </div>
          </div>
        </div>

        {/* Completed TV Series */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Completed Series</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{stats?.watchedSeries || 0}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              out of {stats?.totalSeries || 0} total series
            </div>
          </div>
        </div>

        {/* Total Time Watched */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Time Watched</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{stats?.estimatedHoursWatched || 0}h</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              ~{Math.round((stats?.estimatedHoursWatched || 0) / 24)} days of media
            </div>
          </div>
        </div>

        {/* Episodes Watched */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Episodes Watched</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{stats?.totalEpisodesWatched || 0}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">episodes completed</div>
          </div>
        </div>

        {/* Currently Watching */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Currently Watching</span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{stats?.currentlyWatching || 0}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">active in progress</div>
          </div>
        </div>

        {/* Want to Watch */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Watchlist</span>
            <div className="p-2 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{stats?.wantToWatch || 0}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">queued titles</div>
          </div>
        </div>

        {/* Avg IMDb Rating */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Avg IMDb Rating</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[var(--imdb-gold)]">⭐ {stats?.avgImdbRating || '0.0'}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">overall library score</div>
          </div>
        </div>

        {/* Avg My Rating */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Avg My Rating</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[var(--accent)]">💜 {stats?.avgMyRating || '0.0'}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">personal score / 10</div>
          </div>
        </div>
      </section>

      {/* Chart 1: Monthly Watch Activity (Last 12 Months) */}
      <section className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-bold text-base">Monthly Activity Breakdown (12 Months)</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" /> Movies
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Series Episodes
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 no-scrollbar">
          <div className="h-72 min-w-[550px] sm:min-w-full pt-2">
            {formattedMonthlyWatched.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedMonthlyWatched} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="shortMonth"
                    interval={0}
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(168, 85, 247, 0.08)' }}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload;
                      return item?.month || label;
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-texturina)',
                    }}
                  />
                  <Bar dataKey="movies" name="Movies" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="series" name="Series Episodes" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                No monthly activity logged yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid for Genre & Platform Distribution Charts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Genre Breakdown */}
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <PieIcon className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-base">Top Genres Distribution</h2>
          </div>

          {stats?.genreDistribution && stats.genreDistribution.length > 0 ? (
            <div className="space-y-3 pt-1">
              {stats.genreDistribution.slice(0, 7).map((item: any, idx: number) => {
                const total = stats.genreDistribution.reduce((acc: number, g: any) => acc + g.count, 0);
                const pct = Math.round((item.count / total) * 100);
                const color = GENRE_COLORS[idx % GENRE_COLORS.length];
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{item.name}</span>
                      <span className="text-[var(--text-muted)]">{item.count} titles ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No genre distribution data available.
            </div>
          )}
        </div>

        {/* Platform Breakdown */}
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base">Streaming Platform Distribution</h2>
          </div>

          {stats?.platformDistribution && stats.platformDistribution.length > 0 ? (
            <div className="space-y-3 pt-1">
              {stats.platformDistribution.slice(0, 7).map((item: any, idx: number) => {
                const total = stats.platformDistribution.reduce((acc: number, p: any) => acc + p.count, 0);
                const pct = Math.round((item.count / total) * 100);
                const color = GENRE_COLORS[(idx + 3) % GENRE_COLORS.length];
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{item.name}</span>
                      <span className="text-[var(--text-muted)]">{item.count} titles ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No platform distribution data configured.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
