"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Home,
  BookMarked,
  Sparkles,
  BarChart2,
  Settings,
  Radar,
  Heart,
  Library,
  History,
  LogOut,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/library", icon: BookMarked, label: "Library" },
  { href: "/favorites", icon: Heart, label: "Favorites" },
  { href: "/collections", icon: FolderOpen, label: "Collections" },
  { href: "/stats", icon: BarChart2, label: "Statistics" },
];

const bottomNav = [
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  const isSearchActive = pathname.startsWith("/search");

  return (
    <aside
      aria-label="Sidebar navigation"
      style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        zIndex: 20,
        overflowY: "auto",
      }}
      className="hidden md:flex flex-col"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <Radar size={20} color="white" />
          </div>
          <div>
            <div className="font-extrabold text-base text-[var(--text-primary)] leading-tight tracking-tight">
              WatchRadar
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Your personal watch radar
            </div>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {/* Search Primary Button */}
        <Link
          href="/search"
          aria-current={isSearchActive ? "page" : undefined}
          className={`btn btn-primary w-full justify-start mb-2 ${
            isSearchActive ? "shadow-lg shadow-purple-500/30" : ""
          }`}
        >
          <Search size={18} strokeWidth={2.2} aria-hidden="true" />
          <span>Search & Add</span>
        </Link>

        {mainNav.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        {bottomNav.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="sidebar-nav-item w-full text-left text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );
}
