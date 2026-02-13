'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

interface SiteSettings {
  id: number;
  company_name: string;
  company_description: string;
  phone: string;
  email: string;
  address: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    phone: '',
    email: '',
    address: '',
    facebook_url: '',
    instagram_url: '',
    whatsapp_url: '',
  });

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/user')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erro ao verificar autenticação');
        }
        return res.json();
      })
      .then((data: any) => {
        if (!data.authenticated || data.user.role !== 'admin') {
          router.push('/login');
        } else {
          loadSettings();
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      if (response.ok) {
        const data = (await response.json()) as SiteSettings;
        setSettings(data);
        setFormData({
          company_name: data.company_name || '',
          company_description: data.company_description || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          whatsapp_url: data.whatsapp_url || '',
        });
      } else {
        showError('Erro ao carregar configurações');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      showError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      if (response.ok) {
        const data = (await response.json()) as SiteSettings;
        setSettings(data);
        showSuccess('Configurações salvas com sucesso!');
      } else {
        const errorData = (await response.json()) as { error?: string };
        showError(errorData.error || 'Erro ao salvar configurações');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Configurações do Site</h1>
          <a
            href="/admin"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Voltar
          </a>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          {/* Company Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Informações da Empresa
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ax Festas"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição da Empresa *
              </label>
              <textarea
                name="company_description"
                value={formData.company_description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Aluguel de itens para festas e eventos. Qualidade e excelência no atendimento."
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Informações de Contato
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contato@axfestas.com.br"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A definir"
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Redes Sociais
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook URL
              </label>
              <input
                type="url"
                name="facebook_url"
                value={formData.facebook_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://facebook.com/axfestas"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                name="instagram_url"
                value={formData.instagram_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://instagram.com/axfestas"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp URL
              </label>
              <input
                type="url"
                name="whatsapp_url"
                value={formData.whatsapp_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://wa.me/5500000000000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: https://wa.me/55DDDNÚMERO (sem espaços ou hífen)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
