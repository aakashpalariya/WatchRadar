import bcrypt from "bcryptjs";
import type { PrismaClient } from "../prisma-client";
import { setupTursoTables } from "./setup-turso";

let initPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(prisma: PrismaClient): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await setupTursoTables().catch(() => {});

      // Verify database by counting users or checking demo user
      const userCount = await prisma.user.count().catch(() => 0);
      
      if (userCount === 0) {
        const demoEmail = "demo@watchradar.app";
        const passwordHash = await bcrypt.hash("Demo@123", 12);
        const dobHash = await bcrypt.hash("2001-01-01", 10);

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

