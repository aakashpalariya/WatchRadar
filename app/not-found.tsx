import Link from 'next/link';
import { Film, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in font-[var(--font-texturina)] text-[var(--text-primary)]">
      <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6">
        <Film className="w-10 h-10 text-[var(--accent)] opacity-80" />
      </div>

      <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold mb-3">Title Lost in Space</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mb-8 leading-relaxed">
        The movie, series, or page you were looking for doesn't exist on WatchRadar or has been moved.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="btn btn-primary flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Go to Dashboard
        </Link>
        <Link
          href="/library"
          className="btn btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
      </div>
    </div>
  );
}
