'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface Item {
  id: number;
  name: string;
}

interface Maintenance {
  id: number;
  item_id: number;
  description: string;
  date: string;
  cost?: number;
}

export default function MaintenancePage() {
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [formData, setFormData] = useState({
    item_id: '',
    description: '',
    date: '',
    cost: '',
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadMaintenance();
    loadItems();
  }, []);

  const loadMaintenance = async () => {
    try {
      const response = await fetch('/api/maintenance');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      if (response.ok) {
        const data: any = await response.json();
        setMaintenanceRecords(data);
      }
    } catch (error) {
      console.error('Error loading maintenance:', error);
      setMaintenanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      if (response.ok) {
        const data: any = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const maintenanceData = {
      item_id: parseInt(formData.item_id),
      description: formData.description,
      date: formData.date,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
    };

    try {
      const url = editingMaintenance
        ? `/api/maintenance?id=${editingMaintenance.id}`
        : '/api/maintenance';
      const method = editingMaintenance ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceData),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      if (response.ok) {
        await loadMaintenance();
        setShowForm(false);
        setEditingMaintenance(null);
        setFormData({
          item_id: '',
          description: '',
          date: '',
          cost: '',
        });
        showSuccess(editingMaintenance ? 'Manutenção atualizada com sucesso!' : 'Manutenção registrada com sucesso!');
      } else {
        const error: any = await response.json();
        showError(error.error || 'Erro ao salvar manutenção');
      }
    } catch (error) {
      console.error('Error saving maintenance:', error);
      showError('Erro ao salvar manutenção');
    }
  };

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setFormData({
      item_id: maintenance.item_id.toString(),
      description: maintenance.description,
      date: maintenance.date,
      cost: maintenance.cost?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este registro de manutenção?'))
      return;

    try {
      const response = await fetch(`/api/maintenance?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      if (response.ok) {
        await loadMaintenance();
        showSuccess('Manutenção deletada com sucesso!');
      } else {
        showError('Erro ao deletar manutenção');
      }
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      showError('Erro ao deletar manutenção');
    }
  };

  const getItemName = (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    return item ? item.name : `Item #${itemId}`;
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Controle de Manutenção</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingMaintenance(null);
            setFormData({
              item_id: '',
              description: '',
              date: '',
              cost: '',
            });
          }}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded"
        >
          + Registrar Manutenção
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingMaintenance ? 'Editar Manutenção' : 'Nova Manutenção'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item</label>
              <select
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Selecione um item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder="Descreva o tipo de manutenção realizada..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Custo (R$) - Opcional
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMaintenance(null);
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {maintenanceRecords.length === 0 ? (
          <div className="px-6 py-4">
            <p className="text-gray-500">Nenhuma manutenção registrada</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {maintenanceRecords.map((maintenance) => (
              <li key={maintenance.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {getItemName(maintenance.item_id)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {maintenance.description}
                    </p>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      <span>Data: {maintenance.date}</span>
                      {maintenance.cost && (
                        <span className="text-red-600 font-semibold">
                          Custo: R$ {maintenance.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(maintenance)}
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(maintenance.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}