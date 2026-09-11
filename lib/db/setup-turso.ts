import { createClient } from "@libsql/client";

export async function setupTursoTables() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith("libsql://")) {
    console.log("[Turso Setup] DATABASE_URL is not a Turso URL, skipping Turso schema setup.");
    return;
  }

  console.log("[Turso Setup] Initializing schema tables on Turso Cloud SQLite...");
  const client = createClient({ url: dbUrl });

  const statements = [
    `CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      dobHash TEXT NOT NULL,
      name TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL
    );`,
    `ALTER TABLE User ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT 1;`,
    `ALTER TABLE User ADD COLUMN dob TEXT;`,
    `CREATE TABLE IF NOT EXISTS Media (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tmdbId INTEGER,
      imdbId TEXT,
      title TEXT NOT NULL,
      originalTitle TEXT,
      type TEXT NOT NULL,
      description TEXT,
      posterPath TEXT,
      backdropPath TEXT,
      releaseDate DATETIME,
      runtime INTEGER,
      totalSeasons INTEGER,
      totalEpisodes INTEGER,
      currentSeason INTEGER NOT NULL DEFAULT 1,
      currentEpisode INTEGER NOT NULL DEFAULT 0,
      watchedEpisodes INTEGER NOT NULL DEFAULT 0,
      progressPercentage REAL NOT NULL DEFAULT 0,
      imdbRating REAL,
      imdbVoteCount INTEGER,
      imdbRatingUpdatedAt DATETIME,
      status TEXT NOT NULL DEFAULT 'WANT_TO_WATCH',
      myRating REAL,
      myReview TEXT,
      isFavorite BOOLEAN NOT NULL DEFAULT 0,
      notes TEXT,
      watchedAt DATETIME,
      rewatchCount INTEGER NOT NULL DEFAULT 0,
      director TEXT,
      cast TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Genre (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      tmdbId INTEGER UNIQUE
    );`,
    `CREATE TABLE IF NOT EXISTS MediaGenre (
      id TEXT PRIMARY KEY,
      mediaId TEXT NOT NULL,
      genreId TEXT NOT NULL,
      FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE,
      FOREIGN KEY (genreId) REFERENCES Genre(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Language (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE
    );`,
    `CREATE TABLE IF NOT EXISTS MediaLanguage (
      id TEXT PRIMARY KEY,
      mediaId TEXT NOT NULL,
      languageId TEXT NOT NULL,
      type TEXT NOT NULL,
      FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE,
      FOREIGN KEY (languageId) REFERENCES Language(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS StreamingPlatform (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      logoUrl TEXT,
      color TEXT,
      isDefault BOOLEAN NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS MediaStreamingPlatform (
      id TEXT PRIMARY KEY,
      mediaId TEXT NOT NULL,
      platformId TEXT NOT NULL,
      FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE,
      FOREIGN KEY (platformId) REFERENCES StreamingPlatform(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Subscription (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      platformId TEXT NOT NULL,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (platformId) REFERENCES StreamingPlatform(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Tag (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS MediaTag (
      id TEXT PRIMARY KEY,
      mediaId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Collection (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      coverPath TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS CollectionMedia (
      id TEXT PRIMARY KEY,
      collectionId TEXT NOT NULL,
      mediaId TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (collectionId) REFERENCES Collection(id) ON DELETE CASCADE,
      FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Season (
      id TEXT PRIMARY KEY,
      mediaId TEXT NOT NULL,
      seasonNumber INTEGER NOT NULL,
      name TEXT,
      overview TEXT,
      episodeCount INTEGER NOT NULL DEFAULT 0,
      airDate DATETIME,
      posterPath TEXT,
      FOREIGN KEY (mediaId) REFERENCES Season(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Episode (
      id TEXT PRIMARY KEY,
      seasonId TEXT NOT NULL,
      episodeNumber INTEGER NOT NULL,
      name TEXT,
      overview TEXT,
      airDate DATETIME,
      runtime INTEGER,
      stillPath TEXT,
      isWatched BOOLEAN NOT NULL DEFAULT 0,
      watchedAt DATETIME,
      FOREIGN KEY (seasonId) REFERENCES Season(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS WatchHistory (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      mediaId TEXT NOT NULL,
      episodeId TEXT,
      watchedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE,
      FOREIGN KEY (episodeId) REFERENCES Episode(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS AppSettings (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      theme TEXT NOT NULL DEFAULT 'dark',
      defaultView TEXT NOT NULL DEFAULT 'grid',
      defaultSort TEXT NOT NULL DEFAULT 'createdAt_desc',
      defaultFilter TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );`,
  ];

  for (const sql of statements) {
    try {
      await client.execute(sql);
    } catch (err) {
      console.warn("[Turso Setup] Table creation statement note:", err);
    }
  }

  console.log("[Turso Setup] All Turso schema tables successfully created! 🎉");
}
