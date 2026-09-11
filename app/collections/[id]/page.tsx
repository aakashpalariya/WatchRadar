'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Film, Search, X, Check, Loader2, Library, Sparkles, AlertCircle, Pencil } from 'lucide-react';
import Link from 'next/link';
import MediaCard from '@/components/media/MediaCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { getTMDBImageUrl } from '@/lib/utils/format';

export default function CollectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Collection modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Add titles modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'online'>('library');
  const [libraryMedia, setLibraryMedia] = useState<any[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);
  const [addingMediaIds, setAddingMediaIds] = useState<string[]>([]);

  // Online search state
  const [onlineQuery, setOnlineQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchError, setOnlineSearchError] = useState('');

  useEffect(() => {
    fetchCollection();
  }, [params?.id]);

  const fetchCollection = async () => {
    if (!params?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/collections/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data);
      } else {
        router.push('/collections');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!collection) return;
    setEditName(collection.name || '');
    setEditDescription(collection.description || '');
    setEditNameError('');
    setShowEditModal(true);
  };

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditNameError('');
    if (!editName.trim()) {
      setEditNameError('Collection name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/collections/${params?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
      });

      const updated = await res.json();
      if (!res.ok) {
        setEditNameError(updated.error || 'Failed to update collection');
        return;
      }

      setCollection((prev: any) => ({
        ...prev,
        name: updated.name,
        description: updated.description,
      }));
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      setEditNameError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchUserLibrary = async () => {
    setIsFetchingLibrary(true);
    try {
      const res = await fetch('/api/media?limit=100');
      if (res.ok) {
        const data = await res.json();
        setLibraryMedia(data.media || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingLibrary(false);
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    fetchUserLibrary();
  };

  const handleAddLibraryMediaToCollection = async (mediaId: string) => {
    setAddingMediaIds((prev) => [...prev, mediaId]);
    try {
      const res = await fetch(`/api/collections/${params?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', mediaId }),
      });

      if (res.ok) {
        // Refetch collection items to update UI in real-time
        const updatedRes = await fetch(`/api/collections/${params?.id}`);
        if (updatedRes.ok) {
          const updatedData = await updatedRes.json();
          setCollection(updatedData);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingMediaIds((prev) => prev.filter((id) => id !== mediaId));
    }
  };

  const handleSearchOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnlineSearchError('');
    if (!onlineQuery.trim()) {
      setOnlineSearchError('Please enter a movie or TV series title to search');
      return;
    }
    setIsSearchingOnline(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(onlineQuery)}&page=1`);
      if (res.ok) {
        const data = await res.json();
        const results = data.onlineResults || [];
        setOnlineResults(results);
        if (results.length === 0) {
          setOnlineSearchError(`No online titles found matching "${onlineQuery.trim()}"`);
        }
      } else {
        setOnlineSearchError('Failed to search online. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setOnlineSearchError('Network error while searching online.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleAddOnlineMediaToCollection = async (onlineItem: any) => {
    const tmdbId = Number(onlineItem.tmdbId ?? onlineItem.id);
    const itemTitle = onlineItem.title || onlineItem.name || 'Title';
    const itemType = onlineItem.type || (onlineItem.media_type === 'tv' ? 'SERIES' : 'MOVIE');
    const itemPosterPath = onlineItem.posterPath || onlineItem.poster_path;

    try {
      // 1. Add to user library first
      const createRes = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId,
          title: itemTitle,
          posterPath: itemPosterPath,
          type: itemType,
          status: 'WANT_TO_WATCH',
          imdbRating: onlineItem.imdbRating ?? onlineItem.vote_average ?? null,
          genres: onlineItem.genres || [],
        }),
      });

      if (createRes.ok) {
        const newMedia = await createRes.json();
        // 2. Add to collection
        await handleAddLibraryMediaToCollection(newMedia.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const promptDeleteCollection = () => {
    setConfirmDialog({
      open: true,
      title: 'Delete Collection?',
      description: `Are you sure you want to delete "${collection?.name}"? All titles will remain intact in your personal library.`,
      confirmLabel: 'Delete Collection',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/collections/${params?.id}`, { method: 'DELETE' });
          if (res.ok) router.push('/collections');
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const promptRemoveMedia = (mediaId: string, title?: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove from Collection?',
      description: `Are you sure you want to remove ${title ? `"${title}"` : 'this title'} from "${collection?.name}"?`,
      confirmLabel: 'Remove Title',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/collections/${params?.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', mediaId }),
          });
          if (res.ok) {
            setCollection((prev: any) => ({
              ...prev,
              media: prev.media.filter((item: any) => item.mediaId !== mediaId),
            }));
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const [cardLayout, setCardLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [currentPage, setCurrentPage] = useState(1);

  // Page size: 9 for cards (horizontal), 10 for posters (vertical)
  const pageSize = cardLayout === 'horizontal' ? 9 : 10;


  if (isLoading) {
    return (
      <main className="min-h-screen pt-5 px-4 animate-fade-in font-[var(--font-texturina)] max-w-5xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[2/3] bg-[var(--bg-card)] rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (!collection) return null;

  const formatMediaItem = (m: any) => {
    if (!m) return m;
    return {
      ...m,
      platforms: m.platforms ? m.platforms.map((p: any) => ({ name: p.platform?.name || p.name, color: p.platform?.color || p.color })) : [],
      audioLanguages: m.languages ? m.languages.filter((l: any) => l.type === 'AUDIO').map((l: any) => l.language?.name) : [],
      subtitleLanguages: m.languages ? m.languages.filter((l: any) => l.type === 'SUBTITLE').map((l: any) => l.language?.name) : [],
    };
  };

  const collectionItems = collection?.media || [];
  const existingMediaIds = new Set(collectionItems.map((item: any) => item.mediaId));

  const filteredLibrary = libraryMedia.filter((m: any) =>
    m.title.toLowerCase().includes(librarySearch.toLowerCase().trim())
  );

  return (
    <main className="min-h-screen pt-5 px-4 pb-28 animate-fade-in font-[var(--font-texturina)] text-[var(--text-primary)] max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/collections"
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="page-title truncate">{collection.name}</h1>
            <p className="page-description">
              {collectionItems.length} {collectionItems.length === 1 ? 'title' : 'titles'} in collection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEditModal}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              title="Edit Collection"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={promptDeleteCollection}
              className="btn btn-danger btn-sm flex items-center gap-1.5"
              title="Delete Collection"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {collection.description && (
          <div className="mb-6 pl-4 py-1.5 border-l-3 border-[var(--accent)] bg-[var(--bg-card)]/40 rounded-r-xl">
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed italic">
              "{collection.description}"
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-md shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" /> Add Titles to Collection
          </button>

          {/* View Layout Selector */}
          <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => { setCardLayout('vertical'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cardLayout === 'vertical'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Posters view"
            >
              🖼️ Posters
            </button>
            <button
              type="button"
              onClick={() => { setCardLayout('horizontal'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cardLayout === 'horizontal'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Cards view"
            >
              📱 Cards
            </button>
          </div>
        </div>
      </header>

      {collectionItems.length > 0 ? (() => {
        const totalPages = Math.ceil(collectionItems.length / pageSize);
        const paginatedItems = collectionItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        return (
          <>
            <div className={cardLayout === 'horizontal' ? 'grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'}>
              {paginatedItems.map((item: any) => (
                <div key={item.id} className="relative group">
                  <MediaCard media={formatMediaItem(item.media)} layout={cardLayout} from={`/collections/${collection.id}`} />
                  <button
                    onClick={() => promptRemoveMedia(item.mediaId, item.media?.title)}
                    className="absolute top-2 right-2 p-2 bg-black/80 rounded-full border border-white/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-20"
                    title="Remove from collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                <span className="text-xs text-[var(--text-muted)] font-semibold px-2">
                  Page {currentPage} of {totalPages}
                  <span className="ml-2 text-[var(--text-muted)]/60">· {collectionItems.length} titles</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        );
      })() : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Film className="w-12 h-12 text-[var(--accent)] opacity-40 mb-4" />
          <h3 className="text-lg font-bold mb-1">This Collection is Empty</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6">
            Add titles from your library or search online to curate this collection.
          </p>
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Titles to Collection
          </button>
        </div>
      )}



      {/* Add Titles to Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in font-[var(--font-texturina)]">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">Add Titles to "{collection.name}"</h3>
                <p className="text-xs text-[var(--text-muted)]">Select from your existing library or search online</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[var(--border)] bg-[var(--bg-card)] px-4">
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'library'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Library className="w-4 h-4" /> From My Library
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('online')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'online'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Search className="w-4 h-4" /> Search Online
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'library' ? (
                <div>
                  {/* Library Filter Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      type="text"
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder="Search your library titles..."
                      className="input input-icon-left py-2.5 text-xs bg-[var(--bg-card)]"
                    />
                  </div>

                  {isFetchingLibrary ? (
                    <div className="flex items-center justify-center py-12 text-xs text-[var(--text-muted)] gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" /> Loading library items...
                    </div>
                  ) : filteredLibrary.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                      No matching titles found in your library.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredLibrary.map((item: any) => {
                        const inCollection = existingMediaIds.has(item.id);
                        const isAdding = addingMediaIds.includes(item.id);
                        const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : '';

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/40 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/50 border border-white/10">
                                {item.posterPath ? (
                                  <img
                                    src={getTMDBImageUrl(item.posterPath, 'w92') || ''}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px]">
                                    <Film className="w-4 h-4 opacity-50" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs sm:text-sm truncate text-[var(--text-primary)]">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                                  <span className="font-semibold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-800 dark:text-purple-200 border border-purple-500/30">
                                    {item.type}
                                  </span>
                                  {year && <span>{year}</span>}
                                </div>
                              </div>
                            </div>

                            {inCollection ? (
                              <span className="text-[11px] font-bold text-green-400 bg-green-500/15 px-3 py-1.5 rounded-xl border border-green-500/30 flex items-center gap-1 flex-shrink-0">
                                <Check className="w-3.5 h-3.5" /> Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddLibraryMediaToCollection(item.id)}
                                disabled={isAdding}
                                className="btn btn-primary btn-sm text-xs font-bold px-3 py-1.5 flex items-center gap-1 flex-shrink-0"
                              >
                                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Online Search Tab */
                <div>
                  <form onSubmit={handleSearchOnline} className="mb-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                        <input
                          type="text"
                          value={onlineQuery}
                          onChange={(e) => {
                            setOnlineQuery(e.target.value);
                            if (e.target.value.trim()) setOnlineSearchError('');
                          }}
                          placeholder="Search TMDB for movies or TV series..."
                          className={`input input-icon-left py-2.5 text-xs bg-[var(--bg-card)] ${
                            onlineSearchError ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                          autoFocus
                        />
                      </div>
                      <button type="submit" disabled={isSearchingOnline} className="btn btn-primary btn-sm px-4">
                        {isSearchingOnline ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                      </button>
                    </div>

                    {onlineSearchError && (
                      <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                        <span>{onlineSearchError}</span>
                      </p>
                    )}
                  </form>

                  {onlineResults.length > 0 && (
                    <div className="space-y-2.5">
                      {onlineResults.map((item: any) => {
                        const itemTmdbId = Number(item.tmdbId ?? item.id);
                        const inCollection = collectionItems.some(
                          (ci: any) => ci.media && Number(ci.media.tmdbId) === itemTmdbId
                        );
                        const titleStr = item.title || item.name;
                        const yearStr = (item.release_date || item.first_air_date || item.releaseDate || '').substring(0, 4);

                        return (
                          <div
                            key={itemTmdbId}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/50 border border-white/10">
                                {item.poster_path || item.posterPath ? (
                                  <img
                                    src={getTMDBImageUrl(item.poster_path || item.posterPath, 'w92') || ''}
                                    alt={titleStr}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px]">
                                    <Film className="w-4 h-4 opacity-50" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs sm:text-sm truncate text-[var(--text-primary)]">
                                  {titleStr}
                                </h4>
                                <p className="text-[10px] text-[var(--text-muted)]">{yearStr || 'Online result'}</p>
                              </div>
                            </div>

                            {inCollection ? (
                              <span className="text-[11px] font-bold text-green-400 bg-green-500/15 px-3 py-1.5 rounded-xl border border-green-500/30 flex items-center gap-1 flex-shrink-0">
                                <Check className="w-3.5 h-3.5" /> Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddOnlineMediaToCollection(item)}
                                className="btn btn-primary btn-sm text-xs font-bold px-3 py-1.5 flex items-center gap-1 flex-shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-card)] flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-muted)] hover:bg-white/10 text-[var(--text-secondary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold">Edit Collection</h3>
            <form onSubmit={handleUpdateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (e.target.value.trim()) setEditNameError('');
                  }}
                  placeholder="e.g. Marvel Cinematic Universe"
                  className={`input ${editNameError ? 'input-error border-red-500' : ''}`}
                  style={editNameError ? { borderColor: '#ef4444' } : undefined}
                  autoFocus
                />
                {editNameError && (
                  <p className="text-[11px] mt-1 flex items-center gap-1 font-semibold" style={{ color: '#ef4444' }}>
                    <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} /> {editNameError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                  Description (optional)
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief description of this collection..."
                  rows={3}
                  className="input py-2 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Popup Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        variant="danger"
      />
    </main>
  );
}
