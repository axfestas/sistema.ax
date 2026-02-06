/**
 * Exemplo de uso da integração com Airtable
 * 
 * Este arquivo demonstra como usar as funções do Airtable
 * em um componente React/Next.js
 */

import {
  getItems,
  createItem,
  updateItem,
  getReservations,
  createReservation,
  getMaintenance,
  getFinance,
  getFinanceSummary,
  type Item,
  type Reservation,
} from './airtable';

// ==================== EXEMPLOS DE USO ====================

/**
 * Exemplo 1: Listar todos os itens disponíveis
 */
export async function exampleListAvailableItems() {
  try {
    const items = await getItems({
      filterByFormula: "{status} = 'available'",
      maxRecords: 20,
    });

    console.log('Itens disponíveis:', items);
    return items;
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    throw error;
  }
}

/**
 * Exemplo 2: Criar um novo item
 */
export async function exampleCreateItem() {
  try {
    const newItem = await createItem({
      name: 'Mesa Redonda Premium',
      description: 'Mesa redonda para 8 pessoas com toalha branca',
      category: 'Mobília',
      price: 85.00,
      quantity: 5,
      status: 'available',
    });

    console.log('Item criado:', newItem);
    return newItem;
  } catch (error) {
    console.error('Erro ao criar item:', error);
    throw error;
  }
}

/**
 * Exemplo 3: Atualizar quantidade de um item
 */
export async function exampleUpdateItemQuantity(itemId: string, newQuantity: number) {
  try {
    const updatedItem = await updateItem(itemId, {
      quantity: newQuantity,
    });

    console.log('Item atualizado:', updatedItem);
    return updatedItem;
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    throw error;
  }
}

/**
 * Exemplo 4: Criar uma reserva
 */
export async function exampleCreateReservation() {
  try {
    const newReservation = await createReservation({
      customerName: 'Maria Silva',
      customerEmail: 'maria@example.com',
      customerPhone: '11999999999',
      eventDate: '2026-04-15',
      returnDate: '2026-04-16',
      totalValue: 450.00,
      status: 'pending',
      notes: 'Festa de aniversário - 50 convidados',
    });

    console.log('Reserva criada:', newReservation);
    return newReservation;
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    throw error;
  }
}

/**
 * Exemplo 5: Listar reservas confirmadas
 */
export async function exampleListConfirmedReservations() {
  try {
    const reservations = await getReservations({
      filterByFormula: "{status} = 'confirmed'",
      view: 'Grid view',
    });

    console.log('Reservas confirmadas:', reservations);
    return reservations;
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    throw error;
  }
}

/**
 * Exemplo 6: Buscar itens em manutenção
 */
export async function exampleListMaintenanceItems() {
  try {
    const maintenanceRecords = await getMaintenance({
      filterByFormula: "{status} = 'in_progress'",
    });

    console.log('Itens em manutenção:', maintenanceRecords);
    return maintenanceRecords;
  } catch (error) {
    console.error('Erro ao buscar manutenções:', error);
    throw error;
  }
}

/**
 * Exemplo 7: Obter resumo financeiro do ano
 */
export async function exampleGetYearFinanceSummary() {
  try {
    const summary = await getFinanceSummary('2026-01-01', '2026-12-31');

    console.log('Resumo financeiro de 2026:');
    console.log(`- Receitas: R$ ${summary.totalIncome.toFixed(2)}`);
    console.log(`- Despesas: R$ ${summary.totalExpense.toFixed(2)}`);
    console.log(`- Saldo: R$ ${summary.balance.toFixed(2)}`);
    console.log(`- Transações: ${summary.transactions}`);

    return summary;
  } catch (error) {
    console.error('Erro ao obter resumo financeiro:', error);
    throw error;
  }
}

/**
 * Exemplo 8: Buscar itens por categoria
 */
export async function exampleGetItemsByCategory(category: string) {
  try {
    const items = await getItems({
      filterByFormula: `{category} = '${category}'`,
    });

    console.log(`Itens da categoria ${category}:`, items);
    return items;
  } catch (error) {
    console.error('Erro ao buscar itens por categoria:', error);
    throw error;
  }
}

// ==================== USO EM COMPONENTES NEXT.JS ====================

/**
 * Exemplo de componente Server Component (Next.js 13+)
 * 
 * IMPORTANTE: Para usar em Next.js com static export,
 * você precisa fazer as chamadas via API Routes (Pages Functions)
 * 
 * Para usar este código, coloque-o em um arquivo .tsx dentro de src/app/
 */
export async function exampleServerComponentUsage() {
  // Em produção, use fetch para a API route
  // const response = await fetch('/api/items');
  // const items = await response.json();

  // Em desenvolvimento local com variáveis de ambiente configuradas:
  const items = await getItems({ maxRecords: 10 });

  // Retornar os dados para uso em um componente
  return items;

  /*
  // Exemplo de JSX que seria usado em um componente .tsx:
  return (
    <div>
      <h2>Itens Disponíveis</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.fields.name} - R$ {item.fields.price}
          </li>
        ))}
      </ul>
    </div>
  );
  */
}

/**
 * Exemplo de uso em componente Client (com API route)
 */
export function ItemsListClientComponent() {
  // Exemplo de código que seria usado em um componente client
  // Descomente e use em um componente React real:
  
  /*
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadItems() {
      try {
        const response = await fetch('/api/items?status=available');
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Itens Disponíveis</h2>
      <ul>
        {items.map((item: any) => (
          <li key={item.id}>
            {item.fields.name} - R$ {item.fields.price}
          </li>
        ))}
      </ul>
    </div>
  );
  */

  return null;
}
