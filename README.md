# WatchRadar 🎬

> **Your personal radar for everything you want to watch.**

WatchRadar is a production-quality, mobile-first PWA for managing your personal movie and TV series watchlist. Multi-user with secure authentication, full episode tracking, smart recommendations, and beautiful cinematic design.

---

## ✨ Features

- 🔍 **Search** movies and series via TMDB
- 📚 **Personal Library** with status tracking (Want to Watch / Watching / Watched / On Hold / Dropped)
- ⭐ **IMDb Ratings** displayed (not TMDB ratings)
- 📺 **Series Episode Tracking** — season-by-season progress
- 🎲 **Tonight Mode** — smart recommendations based on your mood, time, and platforms
- ❤️ **Favorites** system
- 📊 **Statistics** — watch habits, genres, platforms, monthly activity
- 🗂️ **Collections** — custom lists (e.g. "Christopher Nolan", "Best Thrillers")
- 🏷️ **Tags** — personal tags for any title
- 💾 **Import / Export** — full data backup to JSON
- 📱 **PWA** — installable as a native-feeling mobile app
- 🌙 **Dark Cinematic Theme** + Light mode support
- 🔒 **Multi-user auth** with email + password + DOB-based password recovery

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Custom CSS |
| UI Components | shadcn/ui + Custom |
| Font | Google Fonts — Texturina |
| Database | Turso (libsql) |
| ORM | Prisma |
| Auth | iron-session + bcryptjs |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Movie Metadata | TMDB API (server-side only) |
| IMDb Ratings | OMDb API (server-side only) |
| Animations | Framer Motion |
| PWA | next-pwa |

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone / Download

```bash
cd "a:\Aakash Projects\WatchRadar"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="libsql://your-db-name.turso.io"
TURSO_AUTH_TOKEN="your_turso_auth_token"
TMDB_API_KEY="your_tmdb_api_key"
OMDB_API_KEY="your_omdb_api_key"
SESSION_SECRET="your-secret-at-least-32-chars-long"
```

#### Getting API Keys

**TMDB API Key:**
1. Go to [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
2. Create a free account
3. Request an API key (free)
4. Copy the "API Key (v3 auth)"

**OMDb API Key (for IMDb ratings):**
1. Go to [https://www.omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)
2. Select the free plan (1,000 requests/day)
3. Enter your email to receive the key

> OMDb is optional — if not configured, IMDb ratings will show "Rating unavailable" instead of breaking the app.

### 4. Set up database

```bash
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client (if not already done)
npx prisma generate
```

### 5. Seed demo data (optional)

```bash
npm run db:seed
```

This creates a demo account:
- **Email:** demo@watchradar.app
- **Password:** Demo@123
- **DOB:** 2001-01-01 / 01/01/2001 (for password reset)

With 5 movies (Interstellar, Inception, Avengers: Endgame, Top Gun: Maverick, Moonlight) and 5 series (Breaking Bad, Game of Thrones, Stranger Things, Arcane, The Boys).

### 6. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:seed      # Seed demo data
npm run db:reset     # Reset database (destructive!)
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Prisma Studio (DB GUI)
```

---

## 🔐 Authentication

WatchRadar uses a **local authentication system**:

- **Sign Up**: email + password + date of birth
- **Sign In**: email + password
- **Forgot Password**: email + date of birth verification → new password
  - No email sending required — DOB is the recovery factor
  - Perfect for a self-hosted personal app

**Security:**
- Passwords hashed with bcrypt (12 rounds)
- DOB stored as bcrypt hash (never plain text)
- Sessions via encrypted iron-session cookies (30-day lifetime)
- All data is user-isolated by `userId`

---

## 📱 PWA Installation

**On Android (Chrome):**
1. Open the app in Chrome
2. Tap the three-dot menu → "Add to Home screen"
3. App installs as a standalone native-feeling app

**On iPhone (Safari):**
1. Open in Safari
2. Tap the Share button → "Add to Home Screen"

---

## 📁 Project Structure

```
app/
├── (auth)/           # Login, Signup, Forgot Password (no nav)
├── api/              # All API routes (server-side only)
├── library/          # Library + detail pages
├── search/           # Global search
├── tonight/          # Recommendation engine
├── history/          # Watch history
├── favorites/        # Favorites
├── collections/      # Custom collections
├── stats/            # Statistics + charts
└── settings/         # Settings (platforms, tags, data, etc.)

components/
├── layout/           # AppShell, BottomNavigation, DesktopSidebar
├── media/            # MediaCard, SearchResultCard, MediaHero
├── series/           # EpisodeProgress, SeasonAccordion
├── dashboard/        # ContinueWatching, StatsBar
├── tonight/          # RecommendationCard
├── library/          # FilterSheet, SortDropdown
└── shared/           # RatingBadge, StatusBadge, FavoriteButton, etc.

lib/
├── auth/             # Session config
├── db/               # Prisma singleton
├── services/         # tmdb.ts, imdb.ts, recommendations.ts
└── utils/            # format.ts, cn.ts

prisma/
├── schema.prisma     # Full DB schema
└── seed.ts           # Demo data seeder
```

---

## 🎨 Design

- **Default theme**: Dark cinematic (#09090b background, #a855f7 accent)
- **Font**: Texturina (Google Fonts) — all weights
- **Mobile-first**: Designed for 320px–414px, scales to 1440px+
- **PWA**: Feels native when installed on mobile

---

## 🔒 Privacy & Data

All data is stored in your **Turso (libsql) database**. Nothing is sent to external servers except:
- TMDB (for movie/series metadata searches) — your search queries only
- OMDb (for IMDb ratings) — IMDb IDs only

Your personal watchlist, ratings, reviews, and notes are stored privately in your own Turso database.

---

## 📄 License

Personal use. Not for redistribution.
