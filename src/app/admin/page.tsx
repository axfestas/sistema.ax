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
          Bem-vindo, <strong>{user.name}</strong>! ({user.email})
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Cargo: <strong>{user.role}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Itens</h2>
          <p className="text-gray-600">Gerenciar catálogo de itens</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Reservas</h2>
          <p className="text-gray-600">Gerenciar reservas de clientes</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Manutenção</h2>
          <p className="text-gray-600">Controlar manutenções</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Financeiro</h2>
          <p className="text-gray-600">Resumo financeiro</p>
        </div>
      </div>
    </div>
  );
}
