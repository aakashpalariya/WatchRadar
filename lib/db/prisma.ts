import { PrismaClient } from "../prisma-client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { ensureDatabaseReady } from "./init";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || !dbUrl.startsWith("libsql://")) {
    throw new Error(
      "[WatchRadar DB] DATABASE_URL must be a Turso libsql:// URL. Please set it in your .env.local file."
    );
  }

  console.log("[WatchRadar DB] Connecting to Turso Cloud database");
  const adapter = new PrismaLibSql({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function initDb(): Promise<void> {
  return ensureDatabaseReady(prisma);
}

export { ensureDatabaseReady };

export default prisma;

