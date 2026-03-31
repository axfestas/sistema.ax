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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-brand-blue via-brand-blue-dark to-[#5a7a97] overflow-hidden transition-opacity duration-500 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      {/* Decorative circles – same style as the home page hero */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[420px] h-[420px] rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute top-1/4 right-8 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

      {/* Yellow accent stripes */}
      <div className="absolute top-0 right-16 w-1.5 h-28 bg-[#FFC107]/60 pointer-events-none rounded-b-full" />
      <div className="absolute top-20 right-28 w-1 h-16 bg-[#FFC107]/40 pointer-events-none rounded-b-full" />

      {/* Purple/lilac accent stripes */}
      <div className="absolute bottom-0 left-10 w-1.5 h-32 bg-[#C08ADC]/60 pointer-events-none rounded-t-full" />
      <div className="absolute bottom-16 left-24 w-1 h-20 bg-[#C08ADC]/40 pointer-events-none rounded-t-full" />

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
