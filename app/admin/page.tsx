"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  ShieldCheck,
  Users,
  Film,
  Tv,
  History,
  Search,
  RefreshCw,
  Lock,
  Key,
  Trash2,
  Edit3,
  Eye,
  ArrowLeft,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Database,
  Star,
  Folder,
  UserPlus,
  Radar,
  X,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  Sun,
  Moon,
  Calendar,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  recentSignups: number;
  totalMedia: number;
  totalMovies: number;
  totalSeries: number;
  totalWatchLogs: number;
}

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  dob?: string | null;
  hasDob?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalMedia: number;
  moviesCount: number;
  seriesCount: number;
  watchingCount: number;
  watchedCount: number;
  collectionsCount: number;
  watchHistoryCount: number;
  tagsCount: number;
  lastActive: string;
}

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  dob?: string | null;
  hasDob?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  collections: { id: string; name: string; _count: { media: number } }[];
  tags: { id: string; name: string; color: string | null }[];
  media: {
    id: string;
    title: string;
    type: "MOVIE" | "SERIES";
    status: string;
    posterPath: string | null;
    myRating: number | null;
    progressPercentage: number;
    watchedAt: string | null;
    updatedAt: string;
  }[];
  watchHistory: {
    id: string;
    watchedAt: string;
    notes: string | null;
    media: { title: string; type: string; posterPath: string | null };
  }[];
}

// Format DOB to e.g. "21 Mar, 2026"
function formatDob(dobStr?: string | null): string | null {
  if (!dobStr) return null;
  const match = dobStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = match[1];
    const monthNum = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[monthNum] || match[2];
    return `${day} ${monthName}, ${year}`;
  }
  const d = new Date(dobStr);
  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${monthName}, ${year}`;
  }
  return dobStr;
}

export default function AdminPage() {
  const { theme, setTheme } = useTheme();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "inactive" | "recent">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [inspectUserDetail, setInspectUserDetail] = useState<UserDetail | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const [editModalUser, setEditModalUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", dob: "" });
  const [editFieldErrors, setEditFieldErrors] = useState<{ name?: string; email?: string; dob?: string }>({});

  const [resetPassUser, setResetPassUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetFieldErrors, setResetFieldErrors] = useState<{ password?: string }>({});

  const [deleteUserModal, setDeleteUserModal] = useState<UserItem | null>(null);

  // Check initial admin auth status
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated === true);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch admin dashboard data
  const fetchData = useCallback(async (query = "") => {
    setIsLoading(true);
    try {
      const url = `/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        let errDetail = "";
        try {
          const errData = await res.json();
          errDetail = errData.error || "";
        } catch {
          // ignore
        }
        throw new Error(errDetail ? `Failed to load admin data: ${errDetail}` : "Failed to load admin data");
      }
      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users);
    } catch (err: any) {
      console.error("Admin load error:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to load dashboard data" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData(searchQuery);
    }
  }, [isAuthenticated, fetchData, searchQuery]);

  // Admin login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Invalid password");
        return;
      }
      setIsAuthenticated(true);
      setPasswordInput("");
    } catch {
      setAuthError("Failed to authenticate");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Admin logout handler
  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      setIsAuthenticated(false);
    } catch {
      setIsAuthenticated(false);
    }
  };

  // Toggle User Active/Inactive Status
  const handleToggleUserActive = async (user: UserItem) => {
    const nextActiveState = !user.isActive;
    setTogglingUserId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActiveState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user status");

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextActiveState } : u))
      );

      setStatusMessage({
        type: "success",
        text: `User ${user.email} is now ${nextActiveState ? "Active" : "Inactive (Blocked)"}`,
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setTogglingUserId(null);
    }
  };

  // Inspect User Modal
  const openInspectModal = async (user: UserItem) => {
    setSelectedUser(user);
    setIsInspecting(true);
    setInspectUserDetail(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setInspectUserDetail(data.user);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Update User Info
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    setEditFieldErrors({});

    const errors: { name?: string; email?: string; dob?: string } = {};
    if (!editForm.name.trim()) {
      errors.name = "User name is required.";
    }
    if (!editForm.email.trim()) {
      errors.email = "User email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (editForm.dob && editForm.dob.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(editForm.dob.trim())) {
        errors.dob = "Date of birth must be YYYY-MM-DD.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${editModalUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Failed to update user";
        if (errorMsg.toLowerCase().includes("email")) {
          setEditFieldErrors({ email: errorMsg });
        } else if (errorMsg.toLowerCase().includes("name")) {
          setEditFieldErrors({ name: errorMsg });
        } else if (errorMsg.toLowerCase().includes("dob") || errorMsg.toLowerCase().includes("birth")) {
          setEditFieldErrors({ dob: errorMsg });
        } else {
          setStatusMessage({ type: "error", text: errorMsg });
        }
        return;
      }

      setStatusMessage({ type: "success", text: `User ${editModalUser.email} updated successfully` });
      setEditModalUser(null);
      setEditFieldErrors({});
      fetchData(searchQuery);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    setResetFieldErrors({});

    if (!newPassword || newPassword.trim().length === 0) {
      setResetFieldErrors({ password: "New password is required." });
      return;
    }
    if (newPassword.trim().length < 6) {
      setResetFieldErrors({ password: "Password must be at least 6 characters long." });
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${resetPassUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetFieldErrors({ password: data.error || "Failed to reset password" });
        return;
      }

      setStatusMessage({ type: "success", text: `Password reset successfully for ${resetPassUser.email}` });
      setResetPassUser(null);
      setNewPassword("");
      setResetFieldErrors({});
    } catch (err: any) {
      setResetFieldErrors({ password: err.message || "Failed to reset password" });
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteUserModal) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteUserModal.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setStatusMessage({ type: "success", text: `User ${deleteUserModal.email} deleted successfully` });
      setDeleteUserModal(null);
      fetchData(searchQuery);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    if (filterTab === "active") return u.isActive;
    if (filterTab === "inactive") return !u.isActive;
    if (filterTab === "recent") {
      const createdDate = new Date(u.createdAt).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return createdDate >= sevenDaysAgo;
    }
    return true;
  });

  // Render Loading State
  if (isAuthenticated === null) {
    return (
      <div className="auth-container" style={{ padding: "16px" }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "var(--accent)" }} />
          <p>Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // Lock Screen (Unauthenticated)
  // ──────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="auth-container" style={{ padding: "16px" }}>
        <div className="auth-card animate-fade-in" style={{ maxWidth: "420px", width: "100%", padding: "24px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                boxShadow: "0 0 30px rgba(234,179,8,0.35)",
                marginBottom: "14px",
              }}
            >
              <ShieldCheck size={32} color="white" />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
              Admin Portal
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              WatchRadar Control Center
            </p>
          </div>

          <form onSubmit={handleAdminLogin}>
            {authError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "10px",
                  color: "#f87171",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertTriangle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="adminPassword"
                style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}
              >
                Admin Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                />
                <input
                  id="adminPassword"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="input"
                  style={{ paddingLeft: "44px", height: "44px", fontSize: "0.9rem" }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn btn-primary"
              style={{ width: "100%", height: "44px", fontSize: "0.95rem", marginBottom: "14px" }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Unlocking...
                </>
              ) : (
                "Unlock Admin Portal"
              )}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <Link
              href="/"
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px",
              }}
            >
              <ArrowLeft size={14} /> Return to WatchRadar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // Authenticated Mobile-First Admin Dashboard
  // ──────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", padding: "12px 12px 40px 12px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Mobile Header Bar */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "16px",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 16px rgba(168,85,247,0.4)",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  Admin Panel
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: 0 }}>
                  Manage users & access permissions
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="btn btn-secondary"
                style={{ padding: "8px", minWidth: "38px", height: "38px" }}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              >
                {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-purple-400" />}
              </button>
              <button
                onClick={() => fetchData(searchQuery)}
                disabled={isLoading}
                className="btn btn-secondary"
                style={{ padding: "8px", minWidth: "38px", height: "38px" }}
                title="Refresh"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={handleAdminLogout}
                className="btn"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.3)",
                  padding: "8px 12px",
                  height: "38px",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <LogOut size={14} /> Exit
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
            <Link
              href="/"
              style={{
                fontSize: "0.8rem",
                color: "var(--accent)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
              }}
            >
              <Radar size={15} /> Back to WatchRadar App
            </Link>
          </div>
        </header>

        {/* Global Toast Message */}
        {statusMessage && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background:
                statusMessage.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${statusMessage.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: statusMessage.type === "success" ? "#4ade80" : "#f87171",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "4px" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Responsive Stats Grid (2 cols mobile, 4 cols desktop) */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {/* Total Users Card */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Users</span>
                <Users size={16} color="#c084fc" />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {stats.totalUsers}
              </h2>
              <span style={{ fontSize: "0.68rem", color: "#4ade80", marginTop: "2px", display: "block" }}>
                +{stats.recentSignups} this week
              </span>
            </div>

            {/* Total Media Card */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Media Tracked</span>
                <Film size={16} color="#60a5fa" />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {stats.totalMedia}
              </h2>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                🎬 {stats.totalMovies} • 📺 {stats.totalSeries}
              </span>
            </div>

            {/* Watch Logs Card */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>History Logs</span>
                <History size={16} color="#facc15" />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {stats.totalWatchLogs}
              </h2>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                User activity logs
              </span>
            </div>

            {/* DB Health Card */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Database</span>
                <Database size={16} color="#4ade80" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "2px 0 0 0" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Connected</span>
              </div>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                SQLite / Turso DB
              </span>
            </div>
          </div>
        )}

        {/* User Directory Control Panel */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "16px",
          }}
        >
          {/* Top Bar: Title & Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 2px 0", color: "var(--text-primary)" }}>
                User Directory ({filteredUsers.length})
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: 0 }}>
                Toggle active status to block/unblock user login
              </p>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", width: "100%" }}>
              <Search
                size={16}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: "36px", height: "40px", fontSize: "0.85rem", width: "100%" }}
              />
            </div>

            {/* Filter Tabs (Horizontal Scrollable on Mobile) */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                paddingBottom: "4px",
                scrollbarWidth: "none",
              }}
            >
              <button
                onClick={() => setFilterTab("all")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: filterTab === "all" ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  color: filterTab === "all" ? "white" : "var(--text-muted)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setFilterTab("active")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: filterTab === "active" ? "#22c55e" : "rgba(255,255,255,0.06)",
                  color: filterTab === "active" ? "white" : "var(--text-muted)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                Active ({users.filter((u) => u.isActive).length})
              </button>
              <button
                onClick={() => setFilterTab("inactive")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: filterTab === "inactive" ? "#ef4444" : "rgba(255,255,255,0.06)",
                  color: filterTab === "inactive" ? "white" : "var(--text-muted)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                Inactive / Blocked ({users.filter((u) => !u.isActive).length})
              </button>
              <button
                onClick={() => setFilterTab("recent")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: filterTab === "recent" ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  color: filterTab === "recent" ? "white" : "var(--text-muted)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                Recent (7d)
              </button>
            </div>
          </div>

          {/* User List Content (Mobile Card View & Desktop Table View) */}
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px auto" }} />
              Loading user directory...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No users found matching filter.
            </div>
          ) : (
            <div>
              {/* Mobile View: Responsive User Cards */}
              <div className="mobile-user-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      background: user.isActive ? "rgba(255,255,255,0.02)" : "rgba(239,68,68,0.05)",
                      border: user.isActive
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(239,68,68,0.25)",
                      borderRadius: "14px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* Top Row: User Avatar, Name/Email & Active Toggle Switch */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: user.isActive
                              ? "linear-gradient(135deg, #a855f7, #6366f1)"
                              : "linear-gradient(135deg, #64748b, #475569)",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user.name || "No Name Set"}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* Active Status Toggle Button */}
                      <button
                        onClick={() => handleToggleUserActive(user)}
                        disabled={togglingUserId === user.id}
                        style={{
                          background: user.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          border: `1px solid ${user.isActive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                          color: user.isActive ? "#4ade80" : "#f87171",
                          borderRadius: "20px",
                          padding: "6px 12px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        title={user.isActive ? "Click to Deactivate / Block User" : "Click to Activate User"}
                      >
                        {togglingUserId === user.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : user.isActive ? (
                          <>
                            <UserCheck size={14} /> Active
                          </>
                        ) : (
                          <>
                            <UserX size={14} /> Blocked
                          </>
                        )}
                      </button>
                    </div>

                    {/* Middle Row: User Stats Pills */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        background: "rgba(0,0,0,0.2)",
                        padding: "8px 10px",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ color: "#60a5fa" }}>🎬 {user.moviesCount} Movies</span>
                      <span>•</span>
                      <span style={{ color: "#c084fc" }}>📺 {user.seriesCount} Series</span>
                      <span>•</span>
                      <span>📁 {user.collectionsCount} Lists</span>
                      <span>•</span>
                      <span>📜 {user.watchHistoryCount} Logs</span>
                    </div>

                    {/* Bottom Row: Actions Bar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: "1px solid var(--border)",
                        paddingTop: "10px",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: user.dob ? "var(--accent)" : "var(--text-muted)",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Calendar size={12} /> DOB: {formatDob(user.dob) || (user.hasDob ? "Registered" : "Not set")}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => openInspectModal(user)}
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "0.75rem", height: "32px" }}
                          title="Inspect Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditModalUser(user);
                            setEditForm({ name: user.name || "", email: user.email, dob: user.dob || "" });
                            setEditFieldErrors({});
                          }}
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "0.75rem", height: "32px" }}
                          title="Edit User"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setResetPassUser(user);
                            setNewPassword("");
                          }}
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "0.75rem", color: "#facc15", height: "32px" }}
                          title="Reset Password"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteUserModal(user)}
                          className="btn"
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.75rem",
                            background: "rgba(239,68,68,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                            height: "32px",
                          }}
                          title="Delete Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ────────────────────────────────────────── */}
      {/* Modal 1: User Inspection Deep Dive */}
      {/* ────────────────────────────────────────── */}
      {selectedUser && isInspecting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "12px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px",
              color: "var(--text-primary)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #a855f7, #6366f1)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {(selectedUser.name || selectedUser.email)[0].toUpperCase()}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedUser.name || "Unnamed User"}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{selectedUser.email}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600 }}>
                      🎂 DOB: {formatDob(selectedUser.dob) || (selectedUser.hasDob ? "Registered" : "Not set")}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsInspecting(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Movies</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "2px" }}>{selectedUser.moviesCount}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Series</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "2px" }}>{selectedUser.seriesCount}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Watching</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "2px", color: "#60a5fa" }}>{selectedUser.watchingCount}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Watched</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "2px", color: "#4ade80" }}>{selectedUser.watchedCount}</div>
              </div>
            </div>

            {!inspectUserDetail ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px auto" }} />
                Fetching full user activity data...
              </div>
            ) : (
              <div>
                {/* User Collections */}
                <div style={{ marginBottom: "18px" }}>
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-secondary)" }}>
                    User Collections ({inspectUserDetail.collections.length})
                  </h4>
                  {inspectUserDetail.collections.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No collections created.</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {inspectUserDetail.collections.map((col) => (
                        <span
                          key={col.id}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            padding: "4px 10px",
                            fontSize: "0.78rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Folder size={12} color="#c084fc" /> {col.name} ({col._count.media})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Watchlist Items */}
                <div style={{ marginBottom: "18px" }}>
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-secondary)" }}>
                    Recent Library Media ({inspectUserDetail.media.length})
                  </h4>
                  {inspectUserDetail.media.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Library is empty.</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
                      {inspectUserDetail.media.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "8px",
                            padding: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {item.posterPath ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                              alt={item.title}
                              style={{ width: "32px", height: "48px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "32px",
                                height: "48px",
                                borderRadius: "4px",
                                background: "rgba(255,255,255,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Film size={16} color="var(--text-muted)" />
                            </div>
                          )}
                          <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "1px" }}>
                              {item.type === "MOVIE" ? "🎬 Movie" : "📺 Series"}
                            </div>
                            {item.myRating && (
                              <div style={{ fontSize: "0.68rem", color: "#facc15", display: "flex", alignItems: "center", gap: "2px" }}>
                                <Star size={9} fill="#facc15" /> {item.myRating}/10
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ textAlign: "right", marginTop: "16px" }}>
              <button onClick={() => setIsInspecting(false)} className="btn btn-secondary" style={{ fontSize: "0.85rem", height: "38px" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────── */}
      {/* Modal 2: Edit User Info */}
      {/* ────────────────────────────────────────── */}
      {editModalUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              maxWidth: "420px",
              width: "100%",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)" }}>
              Edit User Profile
            </h3>
            <form onSubmit={handleUpdateUser} noValidate>
              {/* User Name */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  User Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm({ ...editForm, name: e.target.value });
                    if (editFieldErrors.name) setEditFieldErrors({ ...editFieldErrors, name: undefined });
                  }}
                  placeholder="Enter name"
                  className={`input ${editFieldErrors.name ? "input-error" : ""}`}
                  style={{ height: "42px", fontSize: "0.88rem", borderColor: editFieldErrors.name ? "#ef4444" : undefined }}
                />
                {editFieldErrors.name && (
                  <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} /> {editFieldErrors.name}
                  </p>
                )}
              </div>

              {/* User Email */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  User Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => {
                    setEditForm({ ...editForm, email: e.target.value });
                    if (editFieldErrors.email) setEditFieldErrors({ ...editFieldErrors, email: undefined });
                  }}
                  placeholder="Enter email"
                  className={`input ${editFieldErrors.email ? "input-error" : ""}`}
                  style={{ height: "42px", fontSize: "0.88rem", borderColor: editFieldErrors.email ? "#ef4444" : undefined }}
                />
                {editFieldErrors.email && (
                  <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} /> {editFieldErrors.email}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Date of Birth (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) => {
                    setEditForm({ ...editForm, dob: e.target.value });
                    if (editFieldErrors.dob) setEditFieldErrors({ ...editFieldErrors, dob: undefined });
                  }}
                  placeholder="YYYY-MM-DD"
                  className={`input ${editFieldErrors.dob ? "input-error" : ""}`}
                  style={{ height: "42px", fontSize: "0.88rem", borderColor: editFieldErrors.dob ? "#ef4444" : undefined }}
                />
                {editFieldErrors.dob && (
                  <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} /> {editFieldErrors.dob}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditModalUser(null);
                    setEditFieldErrors({});
                  }}
                  className="btn btn-secondary"
                  style={{ height: "38px" }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ height: "38px" }}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────── */}
      {/* Modal 3: Reset Password */}
      {/* ────────────────────────────────────────── */}
      {resetPassUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              maxWidth: "400px",
              width: "100%",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-primary)" }}>
              Reset Password
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "14px" }}>
              Set new password for <strong>{resetPassUser.email}</strong>.
            </p>
            <form onSubmit={handleResetPassword} noValidate>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (resetFieldErrors.password) setResetFieldErrors({});
                  }}
                  placeholder="Minimum 6 characters"
                  className={`input ${resetFieldErrors.password ? "input-error" : ""}`}
                  style={{ height: "42px", fontSize: "0.88rem", borderColor: resetFieldErrors.password ? "#ef4444" : undefined }}
                />
                {resetFieldErrors.password && (
                  <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} /> {resetFieldErrors.password}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setResetPassUser(null);
                    setResetFieldErrors({});
                  }}
                  className="btn btn-secondary"
                  style={{ height: "38px" }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ height: "38px" }}>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────── */}
      {/* Modal 4: Delete User Confirmation */}
      {/* ────────────────────────────────────────── */}
      {deleteUserModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "16px",
              maxWidth: "400px",
              width: "100%",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(239,68,68,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", color: "#f87171" }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Delete Account?
              </h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "18px", lineHeight: "1.4" }}>
              Permanently delete user <strong>{deleteUserModal.email}</strong>? All their media and watch history will be removed.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" onClick={() => setDeleteUserModal(null)} className="btn btn-secondary" style={{ height: "38px" }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="btn"
                style={{ background: "#ef4444", color: "white", fontWeight: 600, height: "38px" }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
