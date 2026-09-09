'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2, Check, AlertCircle } from 'lucide-react';

interface SyncButtonProps {
  mediaId: string;
  variant?: 'hero' | 'editor';
}

export function SyncButton({ mediaId, variant = 'hero' }: SyncButtonProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/media/${mediaId}/sync`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowModal(true);
        router.refresh();
      } else {
        setErrorMessage(data.error || 'Failed to sync fresh details.');
      }
    } catch {
      setErrorMessage('Network error while syncing details.');
    } finally {
      setIsSyncing(false);
    }
  };

  const modalPopup = showModal && mounted ? createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      {/* Centered Modal Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 font-[var(--font-texturina)] text-[var(--text-primary)] text-center animate-slide-up">
        <div className="w-14 h-14 rounded-full bg-green-500/20 text-green-500 border border-green-500/30 flex items-center justify-center mx-auto shadow-lg shadow-green-500/10">
          <Check className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="font-extrabold text-lg tracking-tight">Fresh Details Synced!</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
            WatchRadar is now fully up to date with fresh ratings & metadata.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(false)}
          className="w-full btn btn-primary py-3 text-xs font-bold shadow-md"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  if (variant === 'hero') {
    return (
      <>
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="p-2.5 rounded-xl bg-black/60 border border-purple-500/40 text-purple-200 hover:bg-black/90 hover:text-white transition-all flex items-center gap-2 text-xs font-bold backdrop-blur-md shadow-lg group active:scale-95"
          title="Sync fresh IMDb ratings, genres, storyline & episodes from TMDB"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
          ) : (
            <RefreshCw className="w-4 h-4 text-[var(--accent)] group-hover:rotate-180 transition-transform duration-500" />
          )}
          <span>{isSyncing ? 'Syncing...' : 'Sync Details'}</span>
        </button>

        {modalPopup}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" /> Full Metadata Sync
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Fetch fresh IMDb ratings, vote counts, genres, storyline synopsis, platforms, and newly aired episodes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-bold"
        >
          {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" />}
          {isSyncing ? 'Syncing...' : 'Sync Fresh Data'}
        </button>
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {modalPopup}
    </div>
  );
}
