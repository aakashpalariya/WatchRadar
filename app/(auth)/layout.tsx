import type { Metadata } from "next";
import { Texturina } from "next/font/google";
import "@/app/globals.css";

const texturina = Texturina({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-texturina",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WatchRadar — Your Personal Watch Radar",
  description: "Your personal radar for everything you want to watch. Track movies, series, ratings, and get smart recommendations.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={texturina.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ fontFamily: "var(--font-texturina), Georgia, serif" }}>
        {children}
      </body>
    </html>
  );
}
