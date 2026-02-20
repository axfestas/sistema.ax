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
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erro ao verificar autenticação');
        }
        return res.json();
      })
      .then((data: any) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading user:', error);
        setLoading(false);
        router.push('/login');
      });
  }, [router]);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!user) {
    return <div className="p-8">Acesso negado. Faça login primeiro.</div>;
  }

  return (
    <>
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

      {/* Atalhos de administração */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <a
          href="/admin/users"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <span className="text-4xl">👤</span>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Usuáries</h2>
            <p className="text-sm text-gray-500">Gerenciar usuáries do sistema</p>
          </div>
        </a>
        <a
          href="/admin/settings"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <span className="text-4xl">⚙️</span>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Configurações</h2>
            <p className="text-sm text-gray-500">Configurações do sistema</p>
          </div>
        </a>
        <a
          href="/admin/test-email"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <span className="text-4xl">✉️</span>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Teste Email</h2>
            <p className="text-sm text-gray-500">Testar envio de e-mails</p>
          </div>
        </a>
        <a
          href="/admin/portfolio"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <span className="text-4xl">🖼️</span>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Portfólio</h2>
            <p className="text-sm text-gray-500">Gerenciar portfólio de eventos</p>
          </div>
        </a>
      </div>
    </>
  );
}
