'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface FinancialRecord {
  id: number;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  period: {
    startDate?: string;
    endDate?: string;
  };
}

export default function FinancePage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    period: {},
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: '',
    date: '',
  });
  const { showSuccess, showError } = useToast();

  const loadRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/finance');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data: FinancialRecord[] = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error loading financial records:', error);
      showError('Erro ao carregar registros financeiros');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/finance/summary');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data: FinancialSummary = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error loading financial summary:', error);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    loadSummary();
  }, [loadRecords, loadSummary]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.description.trim()) {
      showError('Descrição é obrigatória');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      showError('Valor deve ser maior que zero');
      return;
    }

    if (!formData.date) {
      showError('Data é obrigatória');
      return;
    }

    const recordData = {
      type: formData.type,
      description: formData.description,
      amount: amount,
      date: formData.date,
    };

    try {
      const url = editingRecord
        ? `/api/finance?id=${editingRecord.id}`
        : '/api/finance';
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      await loadRecords();
      await loadSummary();
      setShowForm(false);
      setEditingRecord(null);
      setFormData({
        type: 'income',
        description: '',
        amount: '',
        date: '',
      });
      showSuccess(
        editingRecord
          ? 'Registro atualizado com sucesso!'
          : 'Registro criado com sucesso!'
      );
    } catch (error) {
      console.error('Error saving financial record:', error);
      showError('Erro ao salvar registro financeiro');
    }
  };

  const handleEdit = (record: FinancialRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      description: record.description,
      amount: record.amount.toString(),
      date: record.date,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este registro financeiro?'))
      return;

    try {
      const response = await fetch(`/api/finance?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      await loadRecords();
      await loadSummary();
      showSuccess('Registro deletado com sucesso!');
    } catch (error) {
      console.error('Error deleting financial record:', error);
      showError('Erro ao deletar registro financeiro');
    }
  };

  const handleNewRecord = () => {
    setShowForm(true);
    setEditingRecord(null);
    setFormData({
      type: 'income',
      description: '',
      amount: '',
      date: '',
    });
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Controle Financeiro</h2>
        <button
          onClick={handleNewRecord}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + Novo Registro
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Receitas</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Despesas</h3>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(summary.totalExpense)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Saldo</h3>
          <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingRecord ? 'Editar Registro' : 'Novo Registro'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as 'income' | 'expense',
                  })
                }
                required
                className="w-full px-3 py-2 border rounded"
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="Ex: Aluguel de kit, Manutenção de item..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0.00"
                  min="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {records.length === 0 ? (
          <div className="px-6 py-4">
            <p className="text-gray-500">Nenhum registro financeiro encontrado</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {records.map((record) => (
              <li key={record.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          record.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                      <h3 className="text-lg font-semibold">
                        {record.description}
                      </h3>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      <span>Data: {formatDate(record.date)}</span>
                      <span
                        className={`font-semibold ${
                          record.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(record.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
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
