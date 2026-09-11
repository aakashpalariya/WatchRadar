'use client';

export interface MediaOverride {
  status?: string;
  progressPercentage?: number;
  isFavorite?: boolean;
  myRating?: number | null;
  watchedEpisodes?: number;
  currentSeason?: number;
  currentEpisode?: number;
  notes?: string | null;
  audioLanguages?: string[];
  subtitleLanguages?: string[];
  platformIds?: string[];
  watchedAt?: string | null;
  updatedAt?: number;
}

const OVERRIDES_KEY = 'watchradar_media_overrides';
const EPISODES_KEY = 'watchradar_episodes_data';

export function getMediaOverrides(): Record<string, MediaOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getMediaOverride(mediaId: string): MediaOverride | null {
  if (!mediaId) return null;
  const all = getMediaOverrides();
  return all[mediaId] || null;
}

export function saveMediaOverride(mediaId: string, updates: Partial<MediaOverride>): MediaOverride {
  if (typeof window === 'undefined' || !mediaId) return updates;

  try {
    const all = getMediaOverrides();
    const existing = all[mediaId] || {};
    const updated: MediaOverride = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    all[mediaId] = updated;
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));

    // Dispatch event so all components update UI immediately
    window.dispatchEvent(new CustomEvent('watchradar_storage_change', { detail: { mediaId, updated } }));
    return updated;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return updates;
  }
}

export function getEpisodeWatchedMap(mediaId: string): Record<string, boolean> {
  if (typeof window === 'undefined' || !mediaId) return {};
  try {
    const raw = localStorage.getItem(`${EPISODES_KEY}_${mediaId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveEpisodeWatched(mediaId: string, seasonNum: number, epNum: number, isWatched: boolean): Record<string, boolean> {
  if (typeof window === 'undefined' || !mediaId) return {};

  try {
    const map = getEpisodeWatchedMap(mediaId);
    const key = `S${seasonNum}_E${epNum}`;
    map[key] = isWatched;
    localStorage.setItem(`${EPISODES_KEY}_${mediaId}`, JSON.stringify(map));

    window.dispatchEvent(new CustomEvent('watchradar_episode_change', { detail: { mediaId, seasonNum, epNum, isWatched } }));
    return map;
  } catch (err) {
    console.error('Failed to save episode state:', err);
    return {};
  }
}
