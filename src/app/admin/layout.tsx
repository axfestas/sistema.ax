'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from '@/components/LogoutButton';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Geral',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    title: 'Operações',
    items: [
      { href: '/admin/reservation-requests', label: 'Solicitações', icon: '📋' },
      { href: '/admin/reservations', label: 'Reservas', icon: '📅' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/admin/inventory', label: 'Estoque', icon: '📦' },
      { href: '/admin/kits', label: 'Kits', icon: '🎁' },
      { href: '/admin/sweets', label: 'Doces', icon: '🍰' },
      { href: '/admin/designs', label: 'Designs', icon: '🎨' },
      { href: '/admin/themes', label: 'Temas', icon: '🎭' },
      { href: '/admin/categories', label: 'Categorias', icon: '🏷️' },
    ],
  },
  {
    title: 'Comunicação',
    items: [
      { href: '/admin/portfolio', label: 'Portfólio', icon: '🖼️' },
      { href: '/admin/artes', label: 'Artes Criadas', icon: '✏️' },
      { href: '/admin/publicacoes', label: 'Controle de Publicações', icon: '📢' },
      { href: '/admin/testimonials', label: 'Avaliações', icon: '⭐' },
      { href: '/admin/suggestions', label: 'Sugestões', icon: '💡' },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { href: '/admin/combos', label: 'Combos', icon: '🎉' },
      { href: '/admin/quotes', label: 'Orçamentos', icon: '📝' },
      { href: '/admin/contracts', label: 'Contratos', icon: '📄' },
      { href: '/admin/contract-clauses', label: 'Dados do Contrato', icon: '📋' },
    ],
  },
  {
    title: 'Administrativo',
    items: [
      { href: '/admin/clients', label: 'Clientes', icon: '👥' },
      { href: '/admin/finance', label: 'Financeiro', icon: '💰' },
    ],
  },
];

const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Ax Festas</h1>
        <p className="text-sm text-gray-600">Painel Admin</p>
      </div>
      <nav className="p-3 flex-1 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-4 pt-2 border-t border-gray-100' : ''}>
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </p>
            <ul className="mt-1 space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-brand-yellow/20 text-brand-gray font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg w-6 text-center">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
              {allNavItems.find(item => item.href === pathname)?.label || 'Admin'}
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