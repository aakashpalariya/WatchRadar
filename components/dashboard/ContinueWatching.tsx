'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { getTMDBImageUrl } from '@/lib/utils/format';
import HorizontalScrollContainer from '@/components/ui/HorizontalScrollContainer';

interface WatchingItem {
  id: string;
  title: string;
  posterPath: string | null;
  currentSeason: number;
  currentEpisode: number;
  progressPercentage: number;
}

export default function ContinueWatching() {
  const [items, setItems] = useState<WatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWatching = async () => {
      try {
        const res = await fetch('/api/media?status=WATCHING&limit=10');
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch watching items', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatching();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden mb-8">
        <h2 className="section-title mb-4">Continue Watching</h2>
        <div className="flex gap-4 scroll-x pb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card min-w-[240px] h-24 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl skeleton flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="section-title mb-4 font-texturina text-xl font-bold">Continue Watching</h2>
      
      <HorizontalScrollContainer>
        {items.map(item => (
          <Link href={`/library/${item.id}`} key={item.id} className="card flex-shrink-0 w-[280px] sm:w-[320px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:bg-[var(--bg-elevated)] transition-colors group snap-start">
            <div className="flex h-28">
              {/* Thumbnail */}
              <div className="relative w-20 h-full flex-shrink-0 bg-[var(--bg-muted)]">
                {item.posterPath && (
                  <Image
                    src={getTMDBImageUrl(item.posterPath, 'w500') || ''}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-[var(--accent)] rounded-full p-1.5 shadow-lg">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
              
              {/* Info */}
              <div className="flex flex-col flex-grow p-3 justify-between min-w-0">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm truncate mb-0.5">{item.title}</h3>
                  <p className="text-xs text-[var(--accent)] font-medium">S{item.currentSeason.toString().padStart(2, '0')} · E{item.currentEpisode.toString().padStart(2, '0')}</p>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                    <span>Progress</span>
                    <span>{Math.round(item.progressPercentage || 0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--bg-muted)] progress-bar rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--accent)] progress-fill transition-all duration-500"
                      style={{ width: `${item.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </HorizontalScrollContainer>
    </div>
  );
}
