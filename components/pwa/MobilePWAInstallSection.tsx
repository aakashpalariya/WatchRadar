'use client';

import { useState, useEffect } from 'react';
import { Radar, Download, Check, Share, PlusSquare, Smartphone, Laptop } from 'lucide-react';

export function MobilePWAInstallSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'other'>('other');
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.error('SW registration failed:', err));
    }

    // Check if app is running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Device Detection (Android vs iOS vs Other)
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('other');
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (deviceType === 'ios') {
      setShowIOSInstructions(!showIOSInstructions);
    }
  };

  return (
    <section className="block md:hidden bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] space-y-4 shadow-md animate-fade-in">
      {/* Header with Official Watch Radar Logo */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 flex-shrink-0">
            <Radar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] font-[var(--font-texturina)]">
              Watch Radar Mobile App
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Install as a progressive web app on your home screen
            </p>
          </div>
        </div>

        {/* Device Detector Badge */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-800 dark:text-purple-200 border border-purple-500/30 flex items-center gap-1 flex-shrink-0">
          {deviceType === 'ios' ? (
            <>🍎 iOS</>
          ) : deviceType === 'android' ? (
            <>🤖 Android</>
          ) : (
            <><Smartphone className="w-3 h-3 inline" /> Mobile</>
          )}
        </span>
      </div>

      {isInstalled ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-semibold">
          <Check className="w-4 h-4 text-green-500" /> Watch Radar App Installed & Active
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full btn btn-primary py-2.5 flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-purple-500/20"
          >
            <Download className="w-4 h-4" />
            {deviceType === 'ios'
              ? 'How to Install Watch Radar on iPhone / iPad'
              : deviceType === 'android'
              ? 'Install Watch Radar for Android'
              : 'Install Watch Radar App'}
          </button>

          {/* iOS Safari Installation Steps */}
          {deviceType === 'ios' && showIOSInstructions && (
            <div className="p-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-xs space-y-2 text-[var(--text-secondary)] animate-slide-up">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                <span>Installing Watch Radar on Safari iOS:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                <li>
                  Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> <strong>Share button</strong> at the bottom of Safari.
                </li>
                <li>
                  Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-purple-400" /> <strong>Add to Home Screen</strong>.
                </li>
                <li>Tap <strong>Add</strong> at top right to install Watch Radar.</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default MobilePWAInstallSection;
