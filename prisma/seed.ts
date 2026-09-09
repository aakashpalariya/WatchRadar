import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding WatchRadar database...");

  // Create demo user
  const passwordHash = await bcrypt.hash("Demo1234", 12);
  const dobHash = await bcrypt.hash("1995-06-15", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@watchradar.app" },
    update: {},
    create: {
      email: "demo@watchradar.app",
      passwordHash,
      dobHash,
      name: "Demo User",
      appSettings: {
        create: {
          theme: "dark",
          defaultView: "grid",
          defaultSort: "createdAt_desc",
        },
      },
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // Create streaming platforms
  const platforms = [
    { name: "Netflix", color: "#E50914" },
    { name: "Prime Video", color: "#00A8E1" },
    { name: "JioHotstar", color: "#1F80E0" },
    { name: "Sony LIV", color: "#1A1A8C" },
    { name: "ZEE5", color: "#8B2FC9" },
    { name: "Apple TV+", color: "#555555" },
    { name: "YouTube", color: "#FF0000" },
    { name: "JioCinema", color: "#FF6B35" },
    { name: "Other", color: "#6B7280" },
  ];

  const createdPlatforms: Record<string, string> = {};
  for (const p of platforms) {
    const platform = await prisma.streamingPlatform.upsert({
      where: { userId_name: { userId: user.id, name: p.name } },
      update: {},
      create: { userId: user.id, name: p.name, color: p.color, isDefault: true },
    });
    createdPlatforms[p.name] = platform.id;
  }

  // Create subscriptions (Netflix + Prime Video active for demo)
  await prisma.subscription.upsert({
    where: { userId_platformId: { userId: user.id, platformId: createdPlatforms["Netflix"] } },
    update: { isActive: true },
    create: { userId: user.id, platformId: createdPlatforms["Netflix"], isActive: true },
  });
  await prisma.subscription.upsert({
    where: { userId_platformId: { userId: user.id, platformId: createdPlatforms["Prime Video"] } },
    update: { isActive: true },
    create: { userId: user.id, platformId: createdPlatforms["Prime Video"], isActive: true },
  });

  console.log("✅ Streaming platforms seeded");

  // Ensure genres exist
  const genreNames = ["Action", "Drama", "Sci-Fi", "Thriller", "Crime", "Adventure", "Comedy", "Horror", "Romance", "Animation"];
  const genreMap: Record<string, string> = {};
  for (const name of genreNames) {
    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    genreMap[name] = genre.id;
  }

  // Ensure languages exist
  const languageNames = ["English", "Hindi", "Tamil", "Telugu"];
  const langMap: Record<string, string> = {};
  for (const name of languageNames) {
    const lang = await prisma.language.upsert({
      where: { name },
      update: {},
      create: { name, code: name.toLowerCase().slice(0, 2) },
    });
    langMap[name] = lang.id;
  }

  // Create sample tags
  const tags = ["Must Watch", "Mind Bending", "Rewatch", "Family", "Weekend"];
  const tagMap: Record<string, string> = {};
  for (const name of tags) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: {},
      create: { userId: user.id, name },
    });
    tagMap[name] = tag.id;
  }

  console.log("✅ Genres, languages, tags seeded");

  // Helper to create media
  async function createMedia(data: {
    tmdbId?: number;
    imdbId?: string;
    title: string;
    type: "MOVIE" | "SERIES";
    description: string;
    posterPath?: string;
    backdropPath?: string;
    releaseDate: string;
    runtime?: number;
    status: "WANT_TO_WATCH" | "WATCHING" | "WATCHED" | "ON_HOLD" | "DROPPED";
    imdbRating?: number;
    imdbVoteCount?: number;
    myRating?: number;
    myReview?: string;
    isFavorite?: boolean;
    genres: string[];
    platforms: string[];
    audioLanguages?: string[];
    totalSeasons?: number;
    totalEpisodes?: number;
    currentSeason?: number;
    currentEpisode?: number;
    watchedEpisodes?: number;
    watchedAt?: Date;
  }) {
    const media = await prisma.media.create({
      data: {
        userId: user.id,
        tmdbId: data.tmdbId,
        imdbId: data.imdbId,
        title: data.title,
        type: data.type,
        description: data.description,
        posterPath: data.posterPath ?? null,
        backdropPath: data.backdropPath ?? null,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        runtime: data.runtime ?? null,
        status: data.status,
        imdbRating: data.imdbRating ?? null,
        imdbVoteCount: data.imdbVoteCount ?? null,
        imdbRatingUpdatedAt: data.imdbRating ? new Date() : null,
        myRating: data.myRating ?? null,
        myReview: data.myReview ?? null,
        isFavorite: data.isFavorite ?? false,
        totalSeasons: data.totalSeasons ?? null,
        totalEpisodes: data.totalEpisodes ?? null,
        currentSeason: data.currentSeason ?? 1,
        currentEpisode: data.currentEpisode ?? 0,
        watchedEpisodes: data.watchedEpisodes ?? 0,
        progressPercentage: data.totalEpisodes && data.watchedEpisodes
          ? (data.watchedEpisodes / data.totalEpisodes) * 100
          : 0,
        watchedAt: data.watchedAt ?? null,
      },
    });

    // Add genres
    for (const g of data.genres) {
      if (genreMap[g]) {
        await prisma.mediaGenre.create({ data: { mediaId: media.id, genreId: genreMap[g] } });
      }
    }

    // Add platforms
    for (const p of data.platforms) {
      if (createdPlatforms[p]) {
        await prisma.mediaStreamingPlatform.create({
          data: { mediaId: media.id, platformId: createdPlatforms[p] },
        });
      }
    }

    // Add audio languages
    for (const l of (data.audioLanguages ?? ["English"])) {
      if (langMap[l]) {
        await prisma.mediaLanguage.create({
          data: { mediaId: media.id, languageId: langMap[l], type: "AUDIO" },
        });
      }
    }

    return media;
  }

  // ── SEED MOVIES ──
  const interstellar = await createMedia({
    tmdbId: 157336,
    imdbId: "tt0816692",
    title: "Interstellar",
    type: "MOVIE",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIE.jpg",
    backdropPath: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    releaseDate: "2014-11-05",
    runtime: 169,
    status: "WATCHED",
    imdbRating: 8.7,
    imdbVoteCount: 1850000,
    myRating: 9,
    myReview: "An absolute masterpiece. The docking scene is one of the greatest in cinema history.",
    isFavorite: true,
    genres: ["Sci-Fi", "Drama", "Adventure"],
    platforms: ["Prime Video"],
    audioLanguages: ["English", "Hindi"],
    watchedAt: new Date("2024-08-20"),
  });

  await createMedia({
    tmdbId: 27205,
    imdbId: "tt1375666",
    title: "Inception",
    type: "MOVIE",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology.",
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdropPath: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    releaseDate: "2010-07-16",
    runtime: 148,
    status: "WATCHED",
    imdbRating: 8.8,
    imdbVoteCount: 2350000,
    myRating: 10,
    myReview: "Mind-bending perfection. Watched it three times.",
    isFavorite: true,
    genres: ["Sci-Fi", "Action", "Thriller"],
    platforms: ["Netflix"],
    audioLanguages: ["English", "Hindi"],
    watchedAt: new Date("2024-07-10"),
  });

  await createMedia({
    tmdbId: 299534,
    imdbId: "tt4154796",
    title: "Avengers: Endgame",
    type: "MOVIE",
    description: "The Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
    posterPath: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    backdropPath: "/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    releaseDate: "2019-04-26",
    runtime: 181,
    status: "WANT_TO_WATCH",
    imdbRating: 8.4,
    imdbVoteCount: 1120000,
    genres: ["Action", "Adventure", "Sci-Fi"],
    platforms: ["JioHotstar"],
    audioLanguages: ["English", "Hindi", "Tamil"],
  });

  await createMedia({
    tmdbId: 550988,
    imdbId: "tt1745960",
    title: "Top Gun: Maverick",
    type: "MOVIE",
    description: "After more than thirty years of service as one of the Navy's top aviators, Maverick is where he belongs, pushing the envelope as a courageous test pilot.",
    posterPath: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
    backdropPath: "/AkB2kQLldEdwQTiWbHfFCFPVBtb.jpg",
    releaseDate: "2022-05-27",
    runtime: 130,
    status: "WANT_TO_WATCH",
    imdbRating: 8.3,
    imdbVoteCount: 530000,
    genres: ["Action", "Drama"],
    platforms: ["Prime Video"],
    audioLanguages: ["English", "Hindi"],
  });

  await createMedia({
    tmdbId: 396535,
    imdbId: "tt5113044",
    title: "Moonlight",
    type: "MOVIE",
    description: "A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood, adolescence, and burgeoning adulthood.",
    posterPath: "/4911T5FbJ9eAlnDPHeFAqTzfCOT.jpg",
    backdropPath: "/9BRdOber9cH9OB3QHSilEicCHNs.jpg",
    releaseDate: "2016-10-21",
    runtime: 111,
    status: "WANT_TO_WATCH",
    imdbRating: 7.4,
    imdbVoteCount: 290000,
    genres: ["Drama", "Romance"],
    platforms: ["Netflix"],
    audioLanguages: ["English"],
  });

  console.log("✅ Movies seeded");

  // ── SEED SERIES ──
  const breakingBad = await createMedia({
    tmdbId: 1396,
    imdbId: "tt0903747",
    title: "Breaking Bad",
    type: "SERIES",
    description: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student.",
    posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    releaseDate: "2008-01-20",
    runtime: 47,
    status: "WATCHING",
    imdbRating: 9.5,
    imdbVoteCount: 1850000,
    myRating: 10,
    isFavorite: true,
    totalSeasons: 5,
    totalEpisodes: 62,
    currentSeason: 2,
    currentEpisode: 5,
    watchedEpisodes: 18,
    genres: ["Crime", "Drama", "Thriller"],
    platforms: ["Netflix"],
    audioLanguages: ["English", "Hindi"],
  });

  // Add some seasons for Breaking Bad
  const s1 = await prisma.season.create({
    data: {
      mediaId: breakingBad.id,
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: 7,
    },
  });
  // Mark all S1 episodes as watched
  for (let ep = 1; ep <= 7; ep++) {
    await prisma.episode.create({
      data: {
        seasonId: s1.id,
        episodeNumber: ep,
        name: `Episode ${ep}`,
        isWatched: true,
        watchedAt: new Date("2024-09-01"),
      },
    });
  }
  const s2 = await prisma.season.create({
    data: {
      mediaId: breakingBad.id,
      seasonNumber: 2,
      name: "Season 2",
      episodeCount: 13,
    },
  });
  for (let ep = 1; ep <= 13; ep++) {
    await prisma.episode.create({
      data: {
        seasonId: s2.id,
        episodeNumber: ep,
        name: ep === 5 ? "Breakage" : `Episode ${ep}`,
        isWatched: ep <= 5,
        watchedAt: ep <= 5 ? new Date("2024-09-05") : null,
      },
    });
  }

  await createMedia({
    tmdbId: 1399,
    imdbId: "tt0944947",
    title: "Game of Thrones",
    type: "SERIES",
    description: "Seven noble families fight for control of the mythical land of Westeros.",
    posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    backdropPath: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
    releaseDate: "2011-04-17",
    runtime: 57,
    status: "WATCHED",
    imdbRating: 9.2,
    imdbVoteCount: 2200000,
    myRating: 8,
    myReview: "Seasons 1-6 were incredible. The ending was disappointing.",
    isFavorite: false,
    totalSeasons: 8,
    totalEpisodes: 73,
    currentSeason: 8,
    currentEpisode: 6,
    watchedEpisodes: 73,
    genres: ["Action", "Drama", "Adventure"],
    platforms: ["JioHotstar"],
    audioLanguages: ["English", "Hindi"],
    watchedAt: new Date("2024-06-15"),
  });

  await createMedia({
    tmdbId: 66732,
    imdbId: "tt4574334",
    title: "Stranger Things",
    type: "SERIES",
    description: "When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces.",
    posterPath: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdropPath: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    releaseDate: "2016-07-15",
    runtime: 50,
    status: "WANT_TO_WATCH",
    imdbRating: 8.7,
    imdbVoteCount: 1200000,
    genres: ["Horror", "Sci-Fi", "Drama"],
    platforms: ["Netflix"],
    audioLanguages: ["English", "Hindi"],
  });

  await createMedia({
    tmdbId: 94605,
    imdbId: "tt6741278",
    title: "Arcane",
    type: "SERIES",
    description: "Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League of Legends champions.",
    posterPath: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    backdropPath: "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg",
    releaseDate: "2021-11-06",
    runtime: 40,
    status: "WATCHING",
    imdbRating: 9.0,
    imdbVoteCount: 380000,
    myRating: 9,
    isFavorite: true,
    totalSeasons: 2,
    totalEpisodes: 18,
    currentSeason: 1,
    currentEpisode: 6,
    watchedEpisodes: 6,
    genres: ["Action", "Animation", "Drama"],
    platforms: ["Netflix"],
    audioLanguages: ["English", "Hindi"],
  });

  await createMedia({
    tmdbId: 76479,
    imdbId: "tt7440726",
    title: "The Boys",
    type: "SERIES",
    description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.",
    posterPath: "/stTEycfG9928HYGEiL6SyYGQa6b.jpg",
    backdropPath: "/1JEgEFKNdYcFVcqI1GeAq0gT2m6.jpg",
    releaseDate: "2019-07-26",
    runtime: 60,
    status: "WANT_TO_WATCH",
    imdbRating: 8.7,
    imdbVoteCount: 650000,
    genres: ["Action", "Crime", "Sci-Fi"],
    platforms: ["Prime Video"],
    audioLanguages: ["English", "Hindi"],
  });

  console.log("✅ Series seeded");

  // Create a collection
  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name: "Christopher Nolan",
      description: "Best films directed by Christopher Nolan",
    },
  });
  await prisma.collectionMedia.create({ data: { collectionId: collection.id, mediaId: interstellar.id, order: 1 } });

  const bestThrillers = await prisma.collection.create({
    data: {
      userId: user.id,
      name: "Best Thrillers",
      description: "Mind-bending thrillers worth watching",
    },
  });

  // Add watch history
  await prisma.watchHistory.create({
    data: { userId: user.id, mediaId: interstellar.id, watchedAt: new Date("2024-08-20") },
  });
  await prisma.watchHistory.create({
    data: { userId: user.id, mediaId: breakingBad.id, watchedAt: new Date("2024-09-05") },
  });

  console.log("✅ Collections and watch history seeded");

  console.log("\n🎬 Seed complete!");
  console.log("Demo login credentials:");
  console.log("  Email: demo@watchradar.app");
  console.log("  Password: Demo1234");
  console.log("  DOB (for password reset): 1995-06-15");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
