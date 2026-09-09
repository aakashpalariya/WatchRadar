import { Radar } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in font-[var(--font-texturina)]">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
          <Radar className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Scanning WatchRadar...</h3>
      <p className="text-xs text-[var(--text-muted)] max-w-xs">Loading your personal movies and series radar</p>

      {/* Skeleton cards shimmer */}
      <div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 opacity-40">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-[var(--bg-card)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
