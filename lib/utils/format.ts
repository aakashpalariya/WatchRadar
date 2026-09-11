import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRuntime(minutes: number | null): string {
  if (!minutes) return "Unknown";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatYear(date: Date | string | null): string {
  if (!date) return "Unknown";
  return new Date(date).getFullYear().toString();
}

export function formatVoteCount(count: number | null): string {
  if (!count) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

export function formatProgress(watched: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((watched / total) * 100)}%`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UNASSIGNED: "Untagged",
    WANT_TO_WATCH: "Want to Watch",
    WATCHING: "Watching",
    WATCHED: "Watched",
    ON_HOLD: "On Hold",
    DROPPED: "Dropped",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    UNASSIGNED: "text-[var(--text-muted)] bg-[var(--bg-elevated)] border-[var(--border)]",
    WANT_TO_WATCH: "text-blue-600 dark:text-blue-400 bg-blue-500/15 border-blue-500/30",
    WATCHING: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    WATCHED: "text-violet-600 dark:text-violet-400 bg-violet-500/15 border-violet-500/30",
    ON_HOLD: "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30",
    DROPPED: "text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30",
  };
  return colors[status] ?? "text-[var(--text-muted)] bg-[var(--bg-elevated)] border-[var(--border)]";
}

export function getTMDBImageUrl(path: string | null, size: string = "w500"): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
