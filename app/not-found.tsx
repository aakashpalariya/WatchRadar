import Link from "next/link";
import { Film, Home, Search, Compass, Sparkles, Tv, Radar } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Radar Container */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Animated Radar Concentric Circles */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-purple-500/20 flex items-center justify-center relative bg-purple-950/20 backdrop-blur-sm">
          <div className="absolute inset-2 rounded-full border border-purple-500/30 animate-ping opacity-25" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-purple-500/40 flex items-center justify-center bg-purple-900/10">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <Radar className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--accent)] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Floating Error Badge */}
        <div className="absolute -top-2 -right-2 px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-[var(--accent-bright)] text-xs font-mono font-bold rounded-full backdrop-blur-md shadow-lg">
          404 ERROR
        </div>
      </div>

      {/* Hero Headings */}
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 text-[var(--text-primary)]">
        Signal Lost on <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Radar</span>
      </h1>
      <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
        The title, series, or page you are looking for has drifted outside our tracking grid or has not been added to your library yet.
      </p>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-12">
        <Link
          href="/"
          className="btn btn-primary btn-lg flex items-center gap-2 group"
        >
          <Home className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
          Return to Dashboard
        </Link>
        <Link
          href="/search"
          className="btn btn-secondary btn-lg flex items-center gap-2 group"
        >
          <Search className="w-5 h-5 text-[var(--accent)] transition-transform group-hover:scale-110" />
          Search Titles
        </Link>
      </div>

      {/* Quick Jump Radar Cards */}
      <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
        <Link
          href="/library"
          className="card p-3.5 hover:border-[var(--accent)]/50 transition-all flex flex-col gap-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Film className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-bright)] transition-colors">
              Library
            </div>
            <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">
              Your watchlist
            </div>
          </div>
        </Link>

        <Link
          href="/tonight"
          className="card p-3.5 hover:border-[var(--accent)]/50 transition-all flex flex-col gap-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-bright)] transition-colors">
              Tonight Mode
            </div>
            <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">
              Smart picker
            </div>
          </div>
        </Link>

        <Link
          href="/collections"
          className="card p-3.5 hover:border-[var(--accent)]/50 transition-all flex flex-col gap-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Compass className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-bright)] transition-colors">
              Collections
            </div>
            <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">
              Custom lists
            </div>
          </div>
        </Link>

        <Link
          href="/stats"
          className="card p-3.5 hover:border-[var(--accent)]/50 transition-all flex flex-col gap-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Tv className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-bright)] transition-colors">
              Statistics
            </div>
            <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">
              Watch habits
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
