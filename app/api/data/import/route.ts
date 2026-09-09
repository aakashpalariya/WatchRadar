import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();

    const { media, tags, platforms } = body;

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Import tags
    const tagMap: Record<string, string> = {};
    if (tags && Array.isArray(tags)) {
      for (const t of tags) {
        const existing = await prisma.tag.findFirst({ where: { userId, name: t.name } });
        if (existing) {
          tagMap[t.id] = existing.id;
        } else {
          const newTag = await prisma.tag.create({ data: { userId, name: t.name, color: t.color } });
          tagMap[t.id] = newTag.id;
        }
      }
    }

    // Import platforms
    const platformMap: Record<string, string> = {};
    if (platforms && Array.isArray(platforms)) {
      for (const p of platforms) {
        const existing = await prisma.streamingPlatform.findFirst({ where: { userId, name: p.name } });
        if (existing) {
          platformMap[p.id] = existing.id;
        } else {
          const newPlatform = await prisma.streamingPlatform.create({ data: { userId, name: p.name, color: p.color } });
          platformMap[p.id] = newPlatform.id;
        }
      }
    }

    // Import Media
    if (media && Array.isArray(media)) {
      for (const m of media) {
        try {
          const existing = await prisma.media.findFirst({
            where: {
              userId,
              OR: [
                ...(m.tmdbId ? [{ tmdbId: m.tmdbId }] : []),
                ...(m.imdbId ? [{ imdbId: m.imdbId }] : [])
              ]
            }
          });

          if (existing) {
            skipped++;
            continue;
          }

          await prisma.media.create({
            data: {
              userId,
              tmdbId: m.tmdbId,
              imdbId: m.imdbId,
              title: m.title,
              type: m.type,
              status: m.status,
              posterPath: m.posterPath,
              backdropPath: m.backdropPath,
              description: m.description || m.overview,
              releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
              runtime: m.runtime,
              imdbRating: m.imdbRating,
              myRating: m.myRating,
              isFavorite: m.isFavorite,
              notes: m.notes,
            }
          });
          imported++;
        } catch (e: any) {
          errors.push(`Failed to import media ${m.title || m.tmdbId}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
