export function MediaCardSkeleton() {
  return (
    <div className="card w-[160px] sm:w-full max-w-[220px] mx-auto overflow-hidden rounded-lg border border-[var(--border)] skeleton">
      <div className="aspect-[2/3] w-full bg-[var(--bg-elevated)]" />
      <div className="p-3 bg-[var(--bg-card)]">
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4 mb-2" />
        <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/2" />
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="card flex flex-row p-3 gap-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] skeleton">
      <div className="w-24 h-36 flex-shrink-0 bg-[var(--bg-elevated)] rounded-md" />
      <div className="flex flex-col flex-grow py-1 space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/2" />
          <div className="h-4 bg-[var(--bg-elevated)] rounded w-16" />
        </div>
        <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/3" />
        <div className="space-y-2 mt-2">
          <div className="h-3 bg-[var(--bg-elevated)] rounded w-full" />
          <div className="h-3 bg-[var(--bg-elevated)] rounded w-5/6" />
        </div>
        <div className="mt-auto flex justify-end">
          <div className="h-8 bg-[var(--bg-elevated)] rounded w-32" />
        </div>
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="w-full animate-pulse">
      {/* Hero */}
      <div className="w-full h-[60vh] min-h-[400px] bg-[var(--bg-elevated)] relative">
        <div className="absolute bottom-12 left-0 right-0 px-4 sm:px-8 flex flex-col sm:flex-row gap-6">
          <div className="hidden sm:block w-32 md:w-48 aspect-[2/3] bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] -mt-16 z-10" />
          <div className="flex-grow space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-[var(--bg-muted)] rounded" />
              <div className="h-6 w-16 bg-[var(--bg-muted)] rounded" />
            </div>
            <div className="h-10 w-3/4 bg-[var(--bg-muted)] rounded" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="h-8 w-32 bg-[var(--bg-elevated)] rounded" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-[var(--bg-elevated)] rounded" />
            <div className="h-4 w-full bg-[var(--bg-elevated)] rounded" />
            <div className="h-4 w-2/3 bg-[var(--bg-elevated)] rounded" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-48 w-full bg-[var(--bg-elevated)] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] h-24">
          <div className="h-4 w-1/2 bg-[var(--bg-elevated)] rounded mb-3" />
          <div className="h-8 w-1/3 bg-[var(--bg-elevated)] rounded" />
        </div>
      ))}
    </div>
  );
}
