import { PrismaClient } from "@prisma/client";
import { getDatabasePath, bootstrapDatabaseFile, ensureDatabaseReady } from "./init";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  bootstrapDatabaseFile();
  const dbPath = getDatabasePath();
  const sqliteUrl = `file:${dbPath.replace(/\\/g, "/")}`;

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
    process.env.DATABASE_URL = sqliteUrl;
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: sqliteUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function initDb(): Promise<void> {
  return ensureDatabaseReady(prisma);
}

export { ensureDatabaseReady };

export default prisma;
