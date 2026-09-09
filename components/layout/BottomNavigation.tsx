"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookMarked,
  Heart,
  FolderOpen,
  BarChart2,
  Settings,
  Search,
} from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/library", icon: BookMarked, label: "Library" },
  { href: "/favorites", icon: Heart, label: "Favorites" },
  { href: "/collections", icon: FolderOpen, label: "Collections" },
  { href: "/stats", icon: BarChart2, label: "Stats" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const isSearchActive = pathname === "/search";

  return (
    <>
      {/* Floating Action Button (FAB) for Search on Mobile (hidden when on search page) */}
      {!isSearchActive && (
        <Link
          href="/search"
          aria-label="Search and add title"
          className="fixed bottom-20 right-4 z-30 md:hidden w-13 h-13 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-purple-600/40 hover:scale-105"
        >
          <Search size={22} strokeWidth={2.5} />
        </Link>
      )}

      {/* Main Direct Tab Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Main mobile navigation"
        className="fixed bottom-0 left-0 right-0 h-[64px] bg-[var(--bg-surface)]/95 backdrop-blur-xl border-t border-[var(--border)] flex md:hidden items-center justify-around px-1 z-40 shadow-2xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? "text-[var(--accent)] font-bold scale-105"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? "bg-[var(--accent-dim)]" : ""
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] tracking-tight truncate mt-0.5 max-w-[55px] text-center">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default BottomNavigation;
