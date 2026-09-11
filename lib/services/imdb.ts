// IMDb Rating service via OMDb API
// OMDb provides real IMDb ratings — displayed as "IMDb" in UI, never "TMDB"

const OMDB_BASE = "https://www.omdbapi.com";

export interface IMDbRating {
  imdbRating: number | null;
  imdbVoteCount: number | null;
}

export async function fetchIMDbRating(
  imdbId?: string | null,
  title?: string | null,
  year?: string | null
): Promise<IMDbRating> {
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    return { imdbRating: null, imdbVoteCount: null };
  }

  // 1. Try by IMDb ID if available
  if (imdbId) {
    try {
      const url = new URL(OMDB_BASE);
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("i", imdbId);
      url.searchParams.set("r", "json");

      const res = await fetch(url.toString(), {
        next: { revalidate: 86400 }, // cache 24h
        signal: AbortSignal.timeout(2500),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.Response !== "False" && data.imdbRating && data.imdbRating !== "N/A") {
          const rating = parseFloat(data.imdbRating);
          const votes = data.imdbVotes && data.imdbVotes !== "N/A"
            ? parseInt(data.imdbVotes.replace(/,/g, ""), 10)
            : null;
          return { imdbRating: rating, imdbVoteCount: votes };
        }
      }
    } catch {
      // Continue to title fallback
    }
  }

  // 2. Fallback: Search OMDb by Title & Year
  if (title) {
    try {
      const url = new URL(OMDB_BASE);
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("t", title);
      if (year) url.searchParams.set("y", year);
      url.searchParams.set("r", "json");

      const res = await fetch(url.toString(), {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(2500),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.Response !== "False" && data.imdbRating && data.imdbRating !== "N/A") {
          const rating = parseFloat(data.imdbRating);
          const votes = data.imdbVotes && data.imdbVotes !== "N/A"
            ? parseInt(data.imdbVotes.replace(/,/g, ""), 10)
            : null;
          return { imdbRating: rating, imdbVoteCount: votes };
        }
      }
    } catch {
      // Return null fallback
    }
  }

  return { imdbRating: null, imdbVoteCount: null };
}

