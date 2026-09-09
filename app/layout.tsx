import type { Metadata, Viewport } from "next";
import { Texturina } from "next/font/google";
import "@/app/globals.css";
import { AppShell } from "@/components/layout/AppShell";

const texturina = Texturina({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-texturina",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Watch Radar",
    default: "Watch Radar — Your Personal Watch Radar",
  },
  description:
    "Your personal radar for everything you want to watch. Track movies, series, ratings, and get smart recommendations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Watch Radar",
  },
  openGraph: {
    title: "Watch Radar",
    description: "Your personal watch radar.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={texturina.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body style={{ fontFamily: "var(--font-texturina), Georgia, serif" }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
