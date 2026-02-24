'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SplashScreen from '@/components/SplashScreen';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SplashScreen />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
