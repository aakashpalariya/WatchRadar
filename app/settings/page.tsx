'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  Sun,
  Moon,
  Monitor,
  Lock,
  Download,
  Upload,
  LogOut,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Film,
  Heart,
  BarChart2,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { formatDate } from '@/lib/utils/format';
import { MobilePWAInstallSection } from '@/components/pwa/MobilePWAInstallSection';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalMedia: number;
  totalFavorites: number;
  theme: 'dark' | 'light' | 'system';
  defaultView: 'grid' | 'list';
  defaultSort: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Import / Export state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        setName(data.name || '');
      }
    } catch (err) {
      console.error('Failed to load profile settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    if (!name.trim()) {
      setNameError('Display name is required');
      return;
    }
    setIsSavingName(true);
    setNameSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
        if (profile) setProfile({ ...profile, name: name.trim() });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setPasswordSuccess(false);

    let hasErr = false;
    if (!currentPassword) {
      setCurrentPasswordError('Current password is required');
      hasErr = true;
    }
    if (newPassword.length < 8) {
      setNewPasswordError('New password must be at least 8 characters');
      hasErr = true;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('New passwords do not match');
      hasErr = true;
    }
    if (hasErr) return;

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPasswordError(json.error || 'Failed to change password');
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch {
      setPasswordError('Network error. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/data/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watchradar-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage('');
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const data = await res.json();
      if (res.ok) {
        setImportMessage(`Imported ${data.imported} items, skipped ${data.skipped} existing duplicates.`);
        fetchProfile();
      } else {
        setImportMessage(data.error || 'Import failed');
      }
    } catch {
      setImportMessage('Invalid JSON backup file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen pt-5 px-4 pb-24 animate-fade-in font-[var(--font-texturina)] max-w-3xl mx-auto space-y-6">
        <div className="h-28 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
        <div className="h-44 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
        <div className="h-44 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      </main>
    );
  }

  const initials = (profile?.name || profile?.email || 'U').substring(0, 2).toUpperCase();

  return (
    <main className="min-h-screen pt-5 px-4 pb-28 animate-fade-in font-[var(--font-texturina)] text-[var(--text-primary)] max-w-3xl mx-auto">
      <header className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
          <div>
            <h1 className="page-title">Profile & Settings</h1>
            <p className="page-description">Manage your account, preferences, and backups</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="btn btn-danger btn-sm flex items-center gap-1.5"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </header>

      <div className="space-y-6">
        {/* Mobile PWA Installation Option (Visible only in mobile view) */}
        <MobilePWAInstallSection />

        {/* Profile Card */}
        <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-purple-500/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{profile?.name}</h2>
              <p className="text-xs text-[var(--text-muted)] truncate">{profile?.email}</p>
              {profile?.createdAt && (
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>Member since {formatDate(profile.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border)]">
            <div className="bg-[var(--bg-elevated)] p-3 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Library Items</div>
                <div className="text-base font-bold">{profile?.totalMedia || 0}</div>
              </div>
            </div>
            <div className="bg-[var(--bg-elevated)] p-3 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Favorites</div>
                <div className="text-base font-bold">{profile?.totalFavorites || 0}</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/stats')}
            className="w-full mt-2 p-3 bg-[var(--bg-elevated)] hover:bg-[var(--accent)]/10 border border-[var(--border)] hover:border-[var(--accent)]/40 rounded-xl flex items-center justify-between transition-all group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-[var(--accent)]">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">Detailed Watch Statistics</div>
                <div className="text-[11px] text-[var(--text-muted)]">View breakdown, charts & hours watched</div>
              </div>
            </div>
            <span className="text-xs text-[var(--accent)] font-semibold group-hover:translate-x-0.5 transition-transform">
              View Stats →
            </span>
          </button>
        </section>

        {/* Account Details Form */}
        <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <User className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-semibold text-base">Account Information</h2>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setNameError('');
                }}
                className={`input ${nameError ? 'input-error border-red-500' : ''}`}
                style={nameError ? { borderColor: '#ef4444' } : undefined}
                placeholder="Your Name"
              />
              {nameError && (
                <p className="text-[11px] mt-1.5 flex items-center gap-1 font-semibold" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} /> {nameError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="input opacity-60 cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {nameSuccess && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Updated successfully
                </span>
              )}
              <button
                type="submit"
                disabled={isSavingName}
                className="btn btn-primary btn-sm ml-auto flex items-center gap-1.5"
              >
                {isSavingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Name
              </button>
            </div>
          </form>
        </section>

        {/* Appearance & Preferences */}
        <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Monitor className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-semibold text-base">Appearance & Theme</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition-all ${
                  theme === 'dark'
                    ? 'border-[var(--accent)] bg-purple-500/15 font-bold text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                <Moon className="w-5 h-5 mb-1" />
                Dark Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition-all ${
                  theme === 'light'
                    ? 'border-[var(--accent)] bg-purple-500/15 font-bold text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                <Sun className="w-5 h-5 mb-1" />
                Light Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition-all ${
                  theme === 'system'
                    ? 'border-[var(--accent)] bg-purple-500/15 font-bold text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                <Monitor className="w-5 h-5 mb-1" />
                System
              </button>
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Lock className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-semibold text-base">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            {passwordError && (
              <div
                className="p-3 rounded-lg text-xs flex items-center gap-2 font-medium"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444' }}>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Password changed successfully!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (e.target.value) setCurrentPasswordError('');
                }}
                className={`input ${currentPasswordError ? 'input-error border-red-500' : ''}`}
                style={currentPasswordError ? { borderColor: '#ef4444' } : undefined}
                placeholder="••••••••"
              />
              {currentPasswordError && (
                <p className="text-[11px] mt-1 flex items-center gap-1 font-semibold" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} /> {currentPasswordError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (e.target.value.length >= 8) setNewPasswordError('');
                }}
                className={`input ${newPasswordError ? 'input-error border-red-500' : ''}`}
                style={newPasswordError ? { borderColor: '#ef4444' } : undefined}
                placeholder="••••••••"
              />
              {newPasswordError && (
                <p className="text-[11px] mt-1 flex items-center gap-1 font-semibold" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} /> {newPasswordError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value === newPassword) setConfirmPasswordError('');
                }}
                className={`input ${confirmPasswordError ? 'input-error border-red-500' : ''}`}
                style={confirmPasswordError ? { borderColor: '#ef4444' } : undefined}
                placeholder="••••••••"
              />
              {confirmPasswordError && (
                <p className="text-[11px] mt-1 flex items-center gap-1 font-semibold" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} /> {confirmPasswordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2 mt-2"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Password
            </button>
          </form>
        </section>

        {/* Data & Backup */}
        <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Download className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-semibold text-base">Data Backup & Restore</h2>
          </div>

          {importMessage && (
            <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-lg text-purple-700 dark:text-purple-300 text-xs font-semibold">
              {importMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportData}
              disabled={isExporting}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export Library (JSON)
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import Backup File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>
        </section>

        {/* Logout Banner */}
        <section className="pt-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-4 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 hover:border-red-500/50 transition-colors shadow-sm"
          >
            {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            {isLoggingOut ? 'Signing out...' : 'Sign Out of WatchRadar'}
          </button>
        </section>
      </div>
    </main>
  );
}
