'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils/format';

interface FilterState {
  type?: 'MOVIE' | 'SERIES';
  status?: string;
  genres: string[];
  platforms: string[];
  languages: string[];
  minImdbRating?: number;
  minMyRating?: number;
  isFavorite?: boolean;
  sort?: string;
}

interface Platform {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface FilterSheetProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  platforms: Platform[];
  tags: Tag[]; // using tags as genres here for simplicity
  onClose: () => void;
}

export default function FilterSheet({ filters, onChange, platforms, tags, onClose }: FilterSheetProps) {
  
  const handleTypeToggle = (type: 'MOVIE' | 'SERIES') => {
    onChange({ ...filters, type: filters.type === type ? undefined : type });
  };

  const handleStatusToggle = (status: string) => {
    onChange({ ...filters, status: filters.status === status ? undefined : status });
  };
  
  const handleGenreToggle = (genreName: string) => {
    const newGenres = filters.genres.includes(genreName)
      ? filters.genres.filter(g => g !== genreName)
      : [...filters.genres, genreName];
    onChange({ ...filters, genres: newGenres });
  };

  const clearAll = () => {
    onChange({ genres: [], platforms: [], languages: [] });
  };

  const STATUSES = ['PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED'];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-80 lg:shadow-none lg:z-0 lg:h-[calc(100vh-100px)] lg:rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-texturina font-bold text-xl text-[var(--text-primary)]">Filters</h2>
          <div className="flex items-center gap-2">
            <button onClick={clearAll} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Clear All
            </button>
            <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 scroll-x">
          
          <section>
            <h3 className="section-title text-sm mb-3 text-[var(--text-secondary)]">Type</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => handleTypeToggle('MOVIE')}
                className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-colors", filters.type === 'MOVIE' ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-dim)]")}
              >
                Movies
              </button>
              <button 
                onClick={() => handleTypeToggle('SERIES')}
                className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-colors", filters.type === 'SERIES' ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-dim)]")}
              >
                Series
              </button>
            </div>
          </section>

          <section>
            <h3 className="section-title text-sm mb-3 text-[var(--text-secondary)]">Status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(status => (
                <button 
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors", filters.status === status ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-dim)]")}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="section-title text-sm mb-3 text-[var(--text-secondary)]">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button 
                  key={tag.id}
                  onClick={() => handleGenreToggle(tag.name)}
                  className={cn("px-3 py-1.5 rounded-full text-xs border transition-colors", filters.genres.includes(tag.name) ? "bg-[var(--text-primary)] text-[var(--bg-card)] border-[var(--text-primary)]" : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]")}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </section>
          
          <section>
            <div className="flex items-center justify-between bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border)]">
              <span className="font-medium text-sm text-[var(--text-primary)]">Favorites Only</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={!!filters.isFavorite}
                  onChange={(e) => onChange({ ...filters, isFavorite: e.target.checked ? true : undefined })}
                />
                <div className="w-11 h-6 bg-[var(--bg-muted)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>
          </section>

        </div>

        <div className="p-4 border-t border-[var(--border)] lg:hidden">
          <button onClick={onClose} className="btn btn-primary w-full">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
