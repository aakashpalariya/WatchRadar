import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseReady } from "@/lib/db/prisma";
import { checkIsAdmin } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await ensureDatabaseReady(prisma);

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("q")?.trim() || "";

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get Overall System Metrics
    const [
      totalUsers,
      recentSignupsCount,
      totalMediaCount,
      totalMoviesCount,
      totalSeriesCount,
      totalWatchLogsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.media.count(),
      prisma.media.count({ where: { type: "MOVIE" } }),
      prisma.media.count({ where: { type: "SERIES" } }),
      prisma.watchHistory.count(),
    ]);

    // Fetch user list matching optional search query
    const whereClause = searchQuery
      ? {
          OR: [
            { email: { contains: searchQuery } },
            { name: { contains: searchQuery } },
          ],
        }
      : {};

    const users = (await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        dobHash: true,
        dob: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            media: true,
            collections: true,
            watchHistory: true,
            tags: true,
          },
        },
        media: {
          select: {
            type: true,
            status: true,
          },
        },
        watchHistory: {
          take: 1,
          orderBy: { watchedAt: "desc" },
          select: { watchedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })) as any[];

    const formattedUsers = users.map((user: any) => {
      const moviesCount = (user.media || []).filter((m: any) => m.type === "MOVIE").length;
      const seriesCount = (user.media || []).filter((m: any) => m.type === "SERIES").length;
      const watchingCount = (user.media || []).filter((m: any) => m.status === "WATCHING").length;
      const watchedCount = (user.media || []).filter((m: any) => m.status === "WATCHED").length;
      const lastActive = user.watchHistory?.[0]?.watchedAt || user.updatedAt || user.createdAt;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        dob: user.dob || null,
        hasDob: Boolean(user.dobHash || user.dob),
        isActive: user.isActive !== false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        totalMedia: user._count?.media || 0,
        moviesCount,
        seriesCount,
        watchingCount,
        watchedCount,
        collectionsCount: user._count?.collections || 0,
        watchHistoryCount: user._count?.watchHistory || 0,
        tagsCount: user._count?.tags || 0,
        lastActive,
      };
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        recentSignups: recentSignupsCount,
        totalMedia: totalMediaCount,
        totalMovies: totalMoviesCount,
        totalSeries: totalSeriesCount,
        totalWatchLogs: totalWatchLogsCount,
      },
      users: formattedUsers,
    });
  } catch (err: any) {
    console.error("Admin Fetch Users Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch admin users" }, { status: 500 });
  }
}
