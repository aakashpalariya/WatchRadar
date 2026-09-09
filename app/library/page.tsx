'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Filter, SortDesc, Search, Film, Plus } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import FilterSheet from '@/components/library/FilterSheet';
import CustomSelect from '@/components/ui/CustomSelect';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Recently Added' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'imdbRating_desc', label: 'Highest IMDb' },
  { value: 'myRating_desc', label: 'Highest Personal Rating' },
  { value: 'releaseDate_desc', label: 'Release Date' },
];

const TABS = [
  { id: 'All', label: 'All', icon: '🍿' },
  { id: 'Movies', label: 'Movies', type: 'MOVIE', icon: '🎬' },
  { id: 'Series', label: 'Series', type: 'SERIES', icon: '📺' },
  { id: 'Want to Watch', label: 'Want to Watch', status: 'WANT_TO_WATCH', icon: '⏳' },
  { id: 'Watching', label: 'Watching', status: 'WATCHING', icon: '▶️' },
  { id: 'Watched', label: 'Watched', status: 'WATCHED', icon: '✅' },
  { id: 'Favorites', label: 'Favorites', isFavorite: 'true', icon: '❤️' },
];

function LibraryContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sort, setSort] = useState('createdAt_desc');
  const [cardLayout, setCardLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const limitPerPage = cardLayout === 'horizontal' ? 9 : 10;

  // Sync activeTab with URL parameters (tab, status, type, isFavorite)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const favParam = searchParams.get('isFavorite');

    if (tabParam) {
      const matched = TABS.find(
        (t) =>
          t.id.toLowerCase() === tabParam.toLowerCase() ||
          t.id.replace(/\s+/g, '').toLowerCase() === tabParam.replace(/\s+/g, '').toLowerCase()
      );
      if (matched) setActiveTab(matched.id);
    } else if (statusParam) {
      const matched = TABS.find((t) => t.status === statusParam);
      if (matched) setActiveTab(matched.id);
    } else if (typeParam) {
      const matched = TABS.find((t) => t.type === typeParam);
      if (matched) setActiveTab(matched.id);
    } else if (favParam === 'true') {
      const matched = TABS.find((t) => t.id === 'Favorites');
      if (matched) setActiveTab(matched.id);
    }
  }, [searchParams]);

  const fetchMediaForPage = async (targetPage: number, layout = cardLayout) => {
    setIsLoading(true);
    try {
      const selectedTab = TABS.find((t) => t.id === activeTab);
      const limit = layout === 'horizontal' ? 9 : 10;
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: limit.toString(),
        sort,
      });

      if (selectedTab?.type) params.set('type', selectedTab.type);
      if (selectedTab?.status) params.set('status', selectedTab.status);
      if (selectedTab?.isFavorite) params.set('isFavorite', 'true');
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
        setPage(targetPage);
      } else {
        setMedia([]);
      }
    } catch (err) {
      console.error('Failed to fetch media library:', err);
      setMedia([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchMediaForPage(1);
    }, 300);
    return () => clearTimeout(delay);
  }, [activeTab, searchQuery, sort, cardLayout]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchMediaForPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen pt-5 px-4 pb-28 animate-fade-in font-[var(--font-texturina)] text-[var(--text-primary)] max-w-6xl mx-auto">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="page-title">My Library</h1>
            <p className="page-description">
              Track and organize your personal watch collection ({totalItems} {totalItems === 1 ? 'title' : 'titles'} · {limitPerPage} per page)
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap w-full sm:w-auto">
            {/* View Layout Selector */}
            <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCardLayout('horizontal')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  cardLayout === 'horizontal'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Cards view"
              >
                📱 Cards
              </button>
              <button
                type="button"
                onClick={() => setCardLayout('vertical')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  cardLayout === 'vertical'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Posters view"
              >
                🖼️ Posters
              </button>
            </div>

            {/* Sort Dropdown — Expands to fill right side space on mobile */}
            <div className="flex-1 min-w-[150px] sm:flex-none sm:w-[180px]">
              <CustomSelect
                options={SORT_OPTIONS}
                value={sort}
                onChange={(val) => setSort(val)}
                label=""
              />
            </div>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search within your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-icon-left text-sm"
          />
        </div>

        {/* Filter Tab Pills — Multi-line wrap on smaller viewports */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 scale-[1.02] border border-purple-400'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Grid or Empty state */}
      {isLoading ? (
        <div className={cardLayout === 'horizontal' ? 'grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-8' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8'}>
          {Array.from({ length: limitPerPage }, (_, i) => (
            <div
              key={i}
              className={cardLayout === 'horizontal' ? 'h-[160px] rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse' : 'aspect-[2/3] rounded-xl bg-[var(--bg-card)] animate-pulse'}
            />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] my-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-[var(--accent)] opacity-80" />
          </div>
          <h3 className="text-lg font-bold mb-1">Your Library is Empty</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed">
            {searchQuery
              ? `No titles in your library matched "${searchQuery}".`
              : activeTab !== 'All'
              ? `No items found in "${activeTab}".`
              : 'Start adding movies and TV series to build your ultimate personal WatchRadar.'}
          </p>
          <Link
            href="/search"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Search & Add Titles
          </Link>
        </div>
      ) : (
        <>
          {/* 3 in one line grid layout for horizontal cards */}
          <div className={cardLayout === 'horizontal' ? 'grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-8' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8'}>
            {media.map((item: any) => (
              <MediaCard key={item.id} media={item} layout={cardLayout} />
            ))}
          </div>

          {/* Dynamic Items per Page Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] font-medium">
                Showing {Math.min((page - 1) * limitPerPage + 1, totalItems)}–{Math.min(page * limitPerPage, totalItems)} of {totalItems} titles · Page {page} of {totalPages}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || isLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => handlePageChange(pNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      pNum === page
                        ? 'bg-[var(--accent)] text-white shadow-md shadow-purple-500/20'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || isLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-5 px-4 max-w-6xl mx-auto flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}
