// TMDB API Service — Server-side only, never expose API key to client

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const API_KEY = process.env.TMDB_API_KEY!;

export function getTMDBImageUrl(path: string | null, size: string = "w500"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
}

export interface TMDBSearchResponse {
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
  page: number;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  imdb_id: string | null;
  spoken_languages?: { iso_639_1: string; english_name: string; name: string }[];
  original_language?: string;
  "watch/providers"?: {
    results?: Record<string, {
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      rent?: { provider_id: number; provider_name: string; logo_path: string }[];
      buy?: { provider_id: number; provider_name: string; logo_path: string }[];
    }>;
  };
  credits: {
    cast: { id: number; name: string; character: string; order: number }[];
    crew: { id: number; name: string; job: string; department: string }[];
  };
}

export interface TMDBTVDetail {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  external_ids: { imdb_id: string | null };
  spoken_languages?: { iso_639_1: string; english_name: string; name: string }[];
  original_language?: string;
  "watch/providers"?: {
    results?: Record<string, {
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      rent?: { provider_id: number; provider_name: string; logo_path: string }[];
      buy?: { provider_id: number; provider_name: string; logo_path: string }[];
    }>;
  };
  number_of_seasons: number;
  number_of_episodes: number;
  credits: {
    cast: { id: number; name: string; character: string; order: number }[];
    crew: { id: number; name: string; job: string; department: string }[];
  };
  seasons: {
    id: number;
    season_number: number;
    name: string;
    overview: string;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
  }[];
}

export interface TMDBSeasonDetail {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path?: string | null;
  air_date?: string | null;
  episodes: {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    air_date: string | null;
    runtime: number | null;
    still_path: string | null;
  }[];
}

export async function searchTMDB(query: string, page = 1): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>("/search/multi", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

export async function fetchMovieDetails(tmdbId: number): Promise<TMDBMovieDetail> {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}`, {
    append_to_response: "credits,watch/providers,translations",
  });
}

export async function fetchTVDetails(tmdbId: number): Promise<TMDBTVDetail> {
  return tmdbFetch<TMDBTVDetail>(`/tv/${tmdbId}`, {
    append_to_response: "credits,external_ids,watch/providers,translations",
  });
}

export async function fetchSeason(tmdbId: number, seasonNumber: number): Promise<TMDBSeasonDetail> {
  return tmdbFetch<TMDBSeasonDetail>(`/tv/${tmdbId}/season/${seasonNumber}`);
}

export async function fetchTVExternalIds(tmdbId: number): Promise<{ imdb_id: string | null }> {
  return tmdbFetch<{ imdb_id: string | null }>(`/tv/${tmdbId}/external_ids`);
}

// Aliases for compatibility
export const getTMDBDetails = fetchMovieDetails;
export const getTMDBSeasons = fetchSeason;
export const getTMDBTVDetails = fetchTVDetails;
export const getTMDBSeason = fetchSeason;

