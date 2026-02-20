'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

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
    { href: '/admin/settings', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Ax Festas</h1>
          <p className="text-sm text-gray-600">Painel Admin</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
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
        <div className="absolute bottom-4 left-4 right-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="py-6 px-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {navItems.find(item => item.href === pathname)?.label || 'Admin'}
            </h1>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}