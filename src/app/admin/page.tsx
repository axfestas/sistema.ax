'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/user')
      .then((res) => res.json())
      .then((data: any) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!user) {
    return <div className="p-8">Acesso negado. Faça login primeiro.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <LogoutButton />
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <p className="text-lg">
          Bem-vinde, <strong>{user.name}</strong>! ({user.email})
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Cargo: <strong>{user.role}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/admin/inventory" className="bg-blue-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-lg mb-2">📦 Estoque</h2>
          <p className="text-gray-600">Gerenciar todos os itens disponíveis</p>
        </a>
        <a href="/admin/kits" className="bg-indigo-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-lg mb-2">🎁 Kits</h2>
          <p className="text-gray-600">Criar e gerenciar kits de itens</p>
        </a>
        <a href="/admin/reservations" className="bg-green-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-lg mb-2">📅 Reservas</h2>
          <p className="text-gray-600">Gerenciar reservas de clientes</p>
        </a>
        <a href="/admin/users" className="bg-cyan-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-lg mb-2">👥 Usuáries</h2>
          <p className="text-gray-600">Gerenciar contas de usuáries</p>
        </a>
        <a href="/admin/maintenance" className="bg-yellow-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-lg mb-2">🔧 Manutenção</h2>
          <p className="text-gray-600">Controlar manutenções</p>
        </a>
        <a href="/admin/finance" className="bg-purple-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-lg mb-2">💰 Financeiro</h2>
          <p className="text-gray-600">Resumo financeiro</p>
        </a>
        <a href="/admin/portfolio" className="bg-pink-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-lg mb-2">🖼️ Portfólio</h2>
          <p className="text-gray-600">Gerenciar fotos da galeria</p>
        </a>
        <a href="/admin/settings" className="bg-orange-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-lg mb-2">⚙️ Configurações</h2>
          <p className="text-gray-600">Editar informações do site</p>
        </a>
      </div>
    </div>
  );
}
