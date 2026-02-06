'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { clearAuthentication, getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    clearAuthentication();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Painel Admin - Ax Festas</h1>
            <div className="flex items-center gap-4">
              {currentUser && (
                <span className="text-sm text-gray-600">
                  Olá, {currentUser.username} ({currentUser.role})
                </span>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </header>
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4">
              <a href="/admin" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
              <a href="/admin/inventory" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Estoque</a>
              <a href="/admin/reservations" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Reservas</a>
              <a href="/admin/maintenance" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Manutenção</a>
              <a href="/admin/finance" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Financeiro</a>
              <a href="/admin/users" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Usuários</a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}