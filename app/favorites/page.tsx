import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { Heart } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import MediaCard from '@/components/media/MediaCard';

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  if (!session.userId) {
    redirect('/login');
  }

  const favorites = await prisma.media.findMany({
    where: { 
      userId: session.userId,
      isFavorite: true 
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      platforms: { include: { platform: true } },
      languages: { include: { language: true } },
    }
  });

  const formattedFavorites = favorites.map(m => ({
    ...m,
    platforms: m.platforms.map((p: any) => ({ name: p.platform.name, color: p.platform.color })),
    audioLanguages: m.languages.filter((l: any) => l.type === 'AUDIO').map((l: any) => l.language.name),
    subtitleLanguages: m.languages.filter((l: any) => l.type === 'SUBTITLE').map((l: any) => l.language.name),
  }));

  return (
    <main className="min-h-screen pt-5 px-10 pb-28 animate-fade-in font-[var(--font-texturina)] max-w-6xl mx-auto">
      <header className="mb-6 flex items-center gap-2.5">
        <Heart className="w-6 h-6 text-red-500 fill-red-500 flex-shrink-0" />
        <div>
          <h1 className="page-title">My Favorites ❤️</h1>
          <p className="page-description">Quick access to your most beloved movies and series</p>
        </div>
      </header>

      {formattedFavorites.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No favorites yet. Tap ❤ on any title to add it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {formattedFavorites.map(media => (
            <MediaCard key={media.id} media={media} layout="vertical" />
          ))}
        </div>
      )}
    </main>
  );
}

