'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  scrollAmount?: number;
}

export function HorizontalScrollContainer({
  children,
  className = '',
  scrollAmount = 340,
}: HorizontalScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftBtn(scrollLeft > 5);
    setShowRightBtn(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    // Also re-check after images/content load
    const timer = setTimeout(checkScroll, 400);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [children]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="relative group/scroll w-full">
      {/* Left Scroll Button (Desktop view) */}
      {showLeftBtn && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[var(--bg-card)]/90 border border-[var(--border)] text-[var(--text-primary)] shadow-xl items-center justify-center hover:bg-[var(--accent)] hover:text-white hover:scale-110 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Scrollable Container with hidden scrollbars */}
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto gap-4 pt-1.5 pb-4 px-1 snap-x no-scrollbar scrollbar-none scroll-smooth ${className}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>

      {/* Right Scroll Button (Desktop view) */}
      {showRightBtn && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[var(--bg-card)]/90 border border-[var(--border)] text-[var(--text-primary)] shadow-xl items-center justify-center hover:bg-[var(--accent)] hover:text-white hover:scale-110 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default HorizontalScrollContainer;
