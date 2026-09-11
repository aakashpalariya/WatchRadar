"use client";

import { usePathname } from "next/navigation";
import { BottomNavigation } from "./BottomNavigation";
import { DesktopSidebar } from "./DesktopSidebar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const NO_SHELL_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/admin'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNoShellPage = NO_SHELL_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(path)
  );

  if (isNoShellPage) {
    return (
      <ThemeProvider>
        <div className="w-full min-h-screen">
          <main className="w-full min-h-screen">
            {children}
          </main>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div style={{ display: "flex", minHeight: "100dvh" }}>
        {/* Desktop sidebar — hidden on mobile */}
        <DesktopSidebar />

        {/* Main content */}
        <main className="main-content" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>

        {/* Mobile bottom navigation — hidden on desktop */}
        <BottomNavigation />
      </div>
    </ThemeProvider>
  );
}
