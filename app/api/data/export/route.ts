import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    const [
      media,
      collections,
      tags,
      platforms,
      subscriptions,
      user
    ] = await Promise.all([
      prisma.media.findMany({
        where: { userId },
        include: {
          genres: true,
          languages: true,
          platforms: true,
          mediaTags: true,
          seasons: { include: { episodes: true } },
          watchHistory: true
        }
      }),
      prisma.collection.findMany({
        where: { userId },
        include: { media: true }
      }),
      prisma.tag.findMany({ where: { userId } }),
      prisma.streamingPlatform.findMany({ where: { userId } }),
      prisma.subscription.findMany({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        include: { appSettings: true }
      })
    ]);

    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      user: {
        settings: user?.appSettings || {}
      },
      tags,
      platforms,
      subscriptions,
      collections,
      media
    };

    const fileName = `watchradar-backup-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
