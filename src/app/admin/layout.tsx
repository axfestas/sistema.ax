'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/reservation-requests', label: 'Solicitações', icon: '📋' },
    { href: '/admin/reservations', label: 'Reservas', icon: '📅' },
    { href: '/admin/inventory', label: 'Estoque', icon: '📦' },
    { href: '/admin/kits', label: 'Kits', icon: '🎁' },
    { href: '/admin/sweets', label: 'Doces', icon: '🍰' },
    { href: '/admin/designs', label: 'Design', icon: '🎨' },
    { href: '/admin/themes', label: 'Temas', icon: '🎭' },
    { href: '/admin/clients', label: 'Clientes', icon: '👥' },
    { href: '/admin/finance', label: 'Financeiro', icon: '💰' },
    { href: '/admin/categories', label: 'Categorias', icon: '🏷️' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Ax Festas</h1>
        <p className="text-sm text-gray-600">Painel Admin</p>
      </div>
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-pink-100 text-pink-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop: always visible; mobile: drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-md flex flex-col transform transition-transform duration-300 md:static md:translate-x-0 md:flex md:shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow">
          <div className="py-4 px-4 md:py-6 md:px-8 flex items-center gap-4">
            {/* Hamburger button - mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {navItems.find(item => item.href === pathname)?.label || 'Admin'}
            </h1>
          </div>
        </header>
        <main className="p-4 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}