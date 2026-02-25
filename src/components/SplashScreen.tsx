'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const SPLASH_DURATION_MS = 1800;
const FADE_OUT_MS = 500;
const SESSION_KEY = 'ax_splash_shown';

/**
 * Splash screen exibida na primeira abertura do app (por sessão).
 * Imita a experiência de aplicativos de redes sociais como Instagram e YouTube.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Only show in PWA standalone mode or on mobile/tablet devices — not on desktop browsers
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isStandalone && !isMobile) {
      return;
    }

    // Only show once per browser session
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
      return;
    }
    // Mark as shown before setting state so repeated fast mounts don't double-show
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(true);

    const fadeTimer = setTimeout(() => setFadingOut(true), SPLASH_DURATION_MS);
    const hideTimer = setTimeout(() => setVisible(false), SPLASH_DURATION_MS + FADE_OUT_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-brand-yellow via-brand-blue to-brand-purple transition-opacity duration-500 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <div className={`flex flex-col items-center gap-6 ${fadingOut ? '' : 'animate-splash-logo'}`}>
        <div className="relative w-28 h-28 drop-shadow-2xl">
          <Image
            src="/1.png"
            alt="Ax Festas"
            fill
            className="object-contain rounded-2xl"
            priority
          />
        </div>
        <span className="text-white text-3xl font-extrabold tracking-wide drop-shadow-lg select-none">
          Ax Festas
        </span>
      </div>

      {/* Loading dots at the bottom, like social apps */}
      <div className={`absolute bottom-16 flex gap-2 ${fadingOut ? 'opacity-0' : 'animate-splash-dots'}`}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-white/70"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
