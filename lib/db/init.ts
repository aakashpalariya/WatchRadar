import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

export function getDatabasePath(): string {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY
  );

  if (isServerless) {
    const tmpDir = path.join("/tmp", "watchradar_data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch (err) {
        console.warn("[WatchRadar DB] Failed to create /tmp/watchradar_data:", err);
      }
    }
    return path.join(tmpDir, "watchradar.db");
  }

  const customUrl = process.env.DATABASE_URL;
  if (customUrl && customUrl.startsWith("file:")) {
    const rawPath = customUrl.replace(/^file:/, "");
    return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
  }

  const localDir = path.join(process.cwd(), "prisma");
  if (!fs.existsSync(localDir)) {
    try {
      fs.mkdirSync(localDir, { recursive: true });
    } catch {
      // ignore
    }
  }
  return path.join(localDir, "dev.db");
}

export function bootstrapDatabaseFile(): void {
  try {
    const targetDbPath = getDatabasePath();
    const targetDir = path.dirname(targetDbPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(targetDbPath) && fs.statSync(targetDbPath).size > 0) {
      return;
    }

    const candidatePaths = [
      path.join(process.cwd(), "prisma", "starter.db"),
      path.join(process.cwd(), "prisma", "dev.db"),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
        fs.copyFileSync(candidate, targetDbPath);
        console.log(`[WatchRadar DB] Seeded SQLite database initialized from ${candidate} -> ${targetDbPath}`);
        return;
      }
    }
  } catch (error) {
    console.warn("[WatchRadar DB] Error during bootstrapDatabaseFile:", error);
  }
}

let initPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(prisma: PrismaClient): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      bootstrapDatabaseFile();

      // Verify database by counting users or checking demo user
      const userCount = await prisma.user.count().catch(() => 0);
      
      if (userCount === 0) {
        const demoEmail = "demo@watchradar.app";
        const passwordHash = await bcrypt.hash("Demo1234", 12);
        const dobHash = await bcrypt.hash("1995-06-15", 10);

        const user = await prisma.user.create({
          data: {
            email: demoEmail,
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

        console.log(`[WatchRadar DB] Auto-created demo user (${user.email})`);
      }
    } catch (error) {
      console.error("[WatchRadar DB] ensureDatabaseReady error:", error);
    }
  })();

  return initPromise;
}
