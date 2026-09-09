'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderHeart, Plus, Loader2, AlertCircle, Pencil } from 'lucide-react';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(Array.isArray(data) ? data : data.collections || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    if (!name.trim()) {
      setNameError('Collection name is required');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (res.ok) {
        setName('');
        setDescription('');
        setShowCreateModal(false);
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, col: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCollection(col);
    setEditName(col.name || '');
    setEditDescription(col.description || '');
    setEditNameError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection) return;
    setEditNameError('');
    if (!editName.trim()) {
      setEditNameError('Collection name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/collections/${editingCollection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingCollection(null);
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen pt-5 px-4 pb-28 animate-fade-in font-[var(--font-texturina)] text-[var(--text-primary)] max-w-5xl mx-auto">
      <header className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <FolderHeart className="w-6 h-6 text-[var(--accent)]" />
          <div>
            <h1 className="page-title">My Collections</h1>
            <p className="page-description">Curate custom sagas, director showcases, and watch themes</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> New Collection
        </button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] rounded-xl bg-[var(--bg-card)] animate-pulse" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] my-6">
          <FolderHeart className="w-12 h-12 text-[var(--accent)] opacity-40 mb-4" />
          <h3 className="text-lg font-bold mb-1">No Collections Yet</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6">
            Group your favorite movies and series into custom themes, sagas, or director showcases.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Your First Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((col: any) => (
            <Link key={col.id} href={`/collections/${col.id}`}>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)]/50 transition-colors cursor-pointer group p-3 flex flex-col h-full relative">
                <div className="aspect-[16/9] bg-[var(--bg-muted)] rounded-lg overflow-hidden relative mb-3 flex items-center justify-center">
                  <FolderHeart className="w-8 h-8 text-[var(--accent)] opacity-40 group-hover:scale-110 transition-transform" />
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(e, col)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-[var(--accent)] text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-105 z-10"
                    title="Edit Collection"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-semibold text-sm truncate mb-1">{col.name}</h3>
                <p className="text-xs text-[var(--text-muted)] line-clamp-1 mb-2">
                  {col.description || 'No description'}
                </p>
                <div className="mt-auto text-[11px] text-[var(--accent)] font-semibold">
                  {col.itemCount || 0} items
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold">New Collection</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError('');
                  }}
                  placeholder="e.g. Marvel Cinematic Universe"
                  className={`input ${nameError ? 'border-red-500 focus:border-red-500' : ''}`}
                  autoFocus
                />
                {nameError && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" /> {nameError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this collection..."
                  rows={3}
                  className="input py-2 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold">Edit Collection</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
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
                  className={`input ${editNameError ? 'border-red-500 focus:border-red-500' : ''}`}
                  autoFocus
                />
                {editNameError && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" /> {editNameError}
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
    </main>
  );
}
