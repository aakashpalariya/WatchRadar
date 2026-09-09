import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { Search, Plus, Radar, Heart, FolderOpen, BarChart2 } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import StatsBar from '@/components/dashboard/StatsBar';
import MediaCard from '@/components/media/MediaCard';
import { WatchlistCard, RecentlyAddedCard, ContinueWatchingCard } from '@/components/dashboard/HomeCards';
import HorizontalScrollContainer from '@/components/ui/HorizontalScrollContainer';

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.userId) {
    redirect('/login');
  }

  const userId = session.userId;

  // Fetch accurate user stats for Home Page StatsBar
  const allUserMedia = await prisma.media.findMany({
    where: { userId },
    select: { type: true, status: true, runtime: true, watchedEpisodes: true }
  });

  let watchedMovies = 0;
  let watchedSeries = 0;
  let currentlyWatchingCount = 0;
  let sumMovieRuntime = 0;
  let sumEpisodeRuntime = 0;

  allUserMedia.forEach((m) => {
    if (m.status === 'WATCHING') currentlyWatchingCount++;
    if (m.type === 'MOVIE') {
      if (m.status === 'WATCHED') {
        watchedMovies++;
        sumMovieRuntime += m.runtime || 0;
      }
    } else {
      if (m.status === 'WATCHED') {
        watchedSeries++;
      }
      sumEpisodeRuntime += (m.watchedEpisodes || 0) * (m.runtime || 45);
    }
  });

  const estimatedHoursWatched = Math.round((sumMovieRuntime + sumEpisodeRuntime) / 60);

  const stats = {
    watchedMovies,
    watchedSeries,
    currentlyWatchingCount,
    estimatedHoursWatched,
  };

  const includeRelations = {
    platforms: { include: { platform: true } },
    languages: { include: { language: true } },
  };

  const [rawWatching, rawWatchlist, rawRecentlyAdded] = await Promise.all([
    prisma.media.findMany({
      where: { userId, status: 'WATCHING' },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: includeRelations,
    }),
    prisma.media.findMany({
      where: { userId, status: 'WANT_TO_WATCH' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: includeRelations,
    }),
    prisma.media.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: includeRelations,
    }),
  ]);

  const formatItem = (m: any) => ({
    ...m,
    platforms: m.platforms.map((p: any) => ({ name: p.platform.name, color: p.platform.color })),
    audioLanguages: m.languages.filter((l: any) => l.type === 'AUDIO').map((l: any) => l.language.name),
    subtitleLanguages: m.languages.filter((l: any) => l.type === 'SUBTITLE').map((l: any) => l.language.name),
  });

  const currentlyWatching = rawWatching.map(formatItem);
  const watchlist = rawWatchlist.map(formatItem);
  const recentlyAdded = rawRecentlyAdded.map(formatItem);

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <main className="min-h-screen pt-5 px-4 pb-28 animate-fade-in font-[var(--font-texturina)] text-[var(--text-primary)] max-w-5xl mx-auto">
      <header className="mb-6">
        {/* Mobile Brand Header (Visible only in mobile view) */}
        <div className="flex md:hidden items-center gap-2.5 mb-4">
          <div className="w-9.5 h-9.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25">
            <Radar className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[var(--text-primary)] font-[var(--font-texturina)]">
            Watch Radar
          </span>
        </div>

        <h1 className="page-title mb-3">{timeGreeting}, {session.name || 'Movie Explorer'}! 👋</h1>
        
        <Link href="/search" className="block w-full">
          <div className="input flex items-center gap-2.5 cursor-pointer hover:border-[var(--accent)] transition-colors">
            <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <span className="text-[var(--text-muted)] text-sm">Search movies & series to add...</span>
          </div>
        </Link>
      </header>

      <div className="mb-6">
        <StatsBar stats={stats} />
      </div>

      {recentlyAdded.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] my-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/20">
            <Radar className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-1">Your Radar is Active!</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mb-5 leading-relaxed">
            Search for your favorite movies and TV series to start building your personal library.
          </p>
          <Link href="/search" className="btn btn-primary btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Search & Add First Title
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {currentlyWatching.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="section-title text-base sm:text-lg flex items-center gap-2">
                  <span>Continue Watching</span>
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                </h3>
                <Link href="/library?tab=Watching" className="text-xs text-[var(--accent)] font-semibold hover:underline flex items-center gap-1">
                  See All →
                </Link>
              </div>
              <HorizontalScrollContainer>
                {currentlyWatching.map((media) => (
                  <div key={media.id} className="snap-start flex-shrink-0">
                    <ContinueWatchingCard media={media} />
                  </div>
                ))}
              </HorizontalScrollContainer>
            </section>
          )}

          {watchlist.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="section-title text-base sm:text-lg">My Watchlist 🍿</h3>
                <Link href="/library?tab=Want+to+Watch" className="text-xs text-[var(--accent)] font-semibold hover:underline flex items-center gap-1">
                  See All →
                </Link>
              </div>
              <HorizontalScrollContainer>
                {watchlist.map((media) => (
                  <div key={media.id} className="snap-start flex-shrink-0">
                    <WatchlistCard media={media} />
                  </div>
                ))}
              </HorizontalScrollContainer>
            </section>
          )}

          {recentlyAdded.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="section-title text-base sm:text-lg">Recently Added ✨</h3>
                <Link href="/library?tab=All" className="text-xs text-[var(--accent)] font-semibold hover:underline flex items-center gap-1">
                  See All →
                </Link>
              </div>
              <HorizontalScrollContainer>
                {recentlyAdded.map((media) => (
                  <div key={media.id} className="snap-start flex-shrink-0">
                    <RecentlyAddedCard media={media} />
                  </div>
                ))}
              </HorizontalScrollContainer>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
