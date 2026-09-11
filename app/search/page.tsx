'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowLeft, Check } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import { SearchResultCard } from '@/components/media/SearchResultCard';
import AddToLibrarySheet from '@/components/ui/AddToLibrarySheet';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [libraryResults, setLibraryResults] = useState<any[]>([]);
  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [addingTmdbIds, setAddingTmdbIds] = useState<number[]>([]);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results
  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setLibraryResults([]);
        setOnlineResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&page=1`);
        if (res.ok) {
          const data = await res.json();
          setLibraryResults(data.libraryResults || []);
          setOnlineResults(data.onlineResults || []);
        }
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery]);

  const handleAddMedia = (item: any) => {
    setSelectedMedia(item);
  };

  const handleSuccess = (createdMedia?: any) => {
    const addedTitle = createdMedia?.title || selectedMedia?.title || 'Title';
    const targetTmdbId = Number(createdMedia?.tmdbId ?? selectedMedia?.tmdbId ?? selectedMedia?.id);

    if (createdMedia && createdMedia.id) {
      setLibraryResults((prev) => [createdMedia, ...prev.filter((m) => m.id !== createdMedia.id)]);
    } else {
      // Re-query search to update library section
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&page=1`)
        .then(r => r.json())
        .then(data => {
          if (data.libraryResults) setLibraryResults(data.libraryResults);
        }).catch(() => {});
    }

    if (targetTmdbId) {
      setOnlineResults((prev) =>
        prev.map((m: any) =>
          Number(m.tmdbId ?? m.id) === targetTmdbId
            ? { ...m, alreadyInLibrary: true }
            : m
        )
      );
    }

    setSelectedMedia(null);
    setToastMessage(`Added "${addedTitle}" to your library! 🎬`);
    setTimeout(() => setToastMessage(''), 4000);
    router.refresh();
  };

  const handleQuickAdd = async (item: any) => {
    const itemTmdbId = Number(item.tmdbId ?? item.id);
    const itemTitle = item.title || item.name || 'Title';
    const itemType = item.type || (item.media_type === 'tv' ? 'SERIES' : 'MOVIE');
    const itemPosterPath = item.posterPath || item.poster_path;

    if (!itemTmdbId) return;

    setAddingTmdbIds((prev) => [...prev, itemTmdbId]);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: itemTmdbId,
          title: itemTitle,
          posterPath: itemPosterPath,
          type: itemType,
          status: 'UNASSIGNED',
          imdbRating: item.imdbRating ?? item.vote_average ?? null,
          genres: item.genres || [],
        }),
      });
      const json = await res.json();
      if (res.ok) {
        handleSuccess(json);
      } else {
        setToastMessage(`Failed to add: ${json.error || 'Unknown error'}`);
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch {
      setToastMessage('Network error while adding title.');
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      setAddingTmdbIds((prev) => prev.filter((id) => id !== itemTmdbId));
    }
  };

  const handleRemoveMedia = async (item: any) => {
    const itemTmdbId = Number(item.tmdbId ?? item.id);
    const targetInLib = libraryResults.find(m => Number(m.tmdbId) === itemTmdbId);
    
    if (targetInLib && targetInLib.id) {
      try {
        const res = await fetch(`/api/media/${targetInLib.id}`, { method: 'DELETE' });
        if (res.ok) {
          setLibraryResults(prev => prev.filter(m => m.id !== targetInLib.id));
          setOnlineResults(prev => prev.map(m => Number(m.tmdbId ?? m.id) === itemTmdbId ? { ...m, alreadyInLibrary: false } : m));
          setToastMessage(`Removed "${item.title || targetInLib.title}" from library.`);
          setTimeout(() => setToastMessage(''), 4000);
          router.refresh();
        }
      } catch {
        setToastMessage('Failed to remove item.');
        setTimeout(() => setToastMessage(''), 4000);
      }
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen pt-5 px-4 pb-28 animate-fade-in font-[var(--font-texturina)] text-[var(--text-primary)] max-w-5xl mx-auto relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-black px-4 py-2.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-slide-up">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Search Bar */}
      <div className="sticky top-0 z-10 bg-[var(--bg-base)] pt-2 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors flex-shrink-0 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search movies, series, or actors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="input input-icon-left pr-10 text-sm"
            />
            {isLoading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-[var(--accent)]" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!debouncedQuery && !isLoading && (
          <div className="flex flex-col items-center justify-center pt-20 text-center opacity-60">
            <Search className="w-12 h-12 mb-4 opacity-30 text-[var(--accent)]" />
            <p className="text-sm">Type to search your library or discover new titles</p>
          </div>
        )}

        {debouncedQuery && !isLoading && libraryResults.length === 0 && onlineResults.length === 0 && (
          <div className="text-center pt-20 opacity-60">
            <p className="text-sm">No results found for "{debouncedQuery}"</p>
          </div>
        )}

        {/* Local Library Matches */}
        {libraryResults.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>Your Library</span>
              <span className="text-xs font-normal text-[var(--accent)] bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {libraryResults.length} {libraryResults.length === 1 ? 'item' : 'items'}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {libraryResults.map((item: any) => (
                <MediaCard key={item.id} media={item} />
              ))}
            </div>
          </section>
        )}

        {/* Online TMDB Results */}
        {onlineResults.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4">Search Online</h3>
            <div className="flex flex-col gap-3">
              {onlineResults.map((item: any) => {
                const itemTmdbId = Number(item.tmdbId ?? item.id);
                const isItemAdding = addingTmdbIds.includes(itemTmdbId);
                return (
                  <SearchResultCard
                    key={item.tmdbId}
                    media={item}
                    isLoading={isItemAdding}
                    onQuickAdd={() => handleQuickAdd(item)}
                    onAdd={() => handleAddMedia(item)}
                    onRemove={() => handleRemoveMedia(item)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {isLoading && libraryResults.length === 0 && onlineResults.length === 0 && (
          <div className="flex flex-col gap-3 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[var(--bg-card)] animate-pulse rounded-xl" />
            ))}
          </div>
        )}
      </div>

      {selectedMedia && (
        <AddToLibrarySheet
          media={selectedMedia}
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onSuccess={handleSuccess}
        />
      )}
    </main>
  );
}
