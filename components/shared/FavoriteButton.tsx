'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/format';

interface FavoriteButtonProps {
  mediaId: string;
  isFavorite: boolean;
  onToggle?: (newState: boolean) => void;
}

export default function FavoriteButton({ mediaId, isFavorite: initialFavorite, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    const newState = !isFavorite;
    
    // Optimistic UI update
    setIsFavorite(newState);
    if (newState) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500); // Remove animation class after it plays
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newState }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update favorite status');
      }
      
      if (onToggle) {
        onToggle(newState);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert on error
      setIsFavorite(!newState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-[var(--bg-elevated)]/80 backdrop-blur-sm border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors min-h-[44px] min-w-[44px]"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={cn(
          "w-5 h-5 transition-all duration-300",
          isFavorite ? "text-red-500 fill-red-500" : "text-[var(--text-secondary)] group-hover:text-red-400",
          isAnimating ? "animate-[heartPop_0.4s_ease-out]" : ""
        )} 
      />
    </button>
  );
}
