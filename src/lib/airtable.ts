import Airtable from 'airtable';

// Configuração do Airtable
// Para usar em produção no Cloudflare Pages, configure as variáveis de ambiente
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';

// Nomes das tabelas (configuráveis via env vars)
export const TABLES = {
  ITEMS: process.env.AIRTABLE_ITEMS_TABLE || 'Items',
  RESERVATIONS: process.env.AIRTABLE_RESERVATIONS_TABLE || 'Reservations',
  MAINTENANCE: process.env.AIRTABLE_MAINTENANCE_TABLE || 'Maintenance',
  FINANCE: process.env.AIRTABLE_FINANCE_TABLE || 'Finance',
};

// Inicializar cliente Airtable
let airtableBase: Airtable.Base | null = null;

export function getAirtableBase(): Airtable.Base {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error(
      'Airtable credentials not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.'
    );
  }

  if (!airtableBase) {
    Airtable.configure({
      apiKey: AIRTABLE_API_KEY,
    });
    airtableBase = Airtable.base(AIRTABLE_BASE_ID);
  }

  return airtableBase;
}

// Interface genérica para registros do Airtable
export interface AirtableRecord<T = any> {
  id: string;
  fields: T;
  createdTime: string;
}

// Interfaces para os tipos de dados
export interface Item {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  quantity?: number;
  status?: 'available' | 'reserved' | 'maintenance';
  imageUrl?: string;
  [key: string]: any; // Allow additional fields from Airtable
}

export interface Reservation {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  eventDate: string;
  returnDate?: string;
  items?: string[]; // IDs dos itens
  totalValue?: number;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  [key: string]: any; // Allow additional fields from Airtable
}

export interface Maintenance {
  itemId: string;
  itemName?: string;
  issueDescription: string;
  startDate: string;
  completionDate?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  cost?: number;
  technician?: string;
  notes?: string;
  [key: string]: any; // Allow additional fields from Airtable
}

export interface Finance {
  type: 'income' | 'expense';
  category?: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  relatedReservation?: string;
  notes?: string;
  [key: string]: any; // Allow additional fields from Airtable
}

// ==================== FUNÇÕES PARA ITENS ====================

/**
 * Buscar todos os itens
 */
export async function getItems(options?: {
  maxRecords?: number;
  view?: string;
  filterByFormula?: string;
}): Promise<AirtableRecord<Item>[]> {
  const base = getAirtableBase();
  const records: AirtableRecord<Item>[] = [];

  await base(TABLES.ITEMS)
    .select({
      maxRecords: options?.maxRecords,
      view: options?.view,
      filterByFormula: options?.filterByFormula,
    })
    .eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push({
          id: record.id,
          fields: record.fields as unknown as Item,
          createdTime: record.get('createdTime') as string,
        });
      });
      fetchNextPage();
    });

  return records;
}

/**
 * Buscar item por ID
 */
export async function getItemById(id: string): Promise<AirtableRecord<Item> | null> {
  const base = getAirtableBase();
  
  try {
    const record = await base(TABLES.ITEMS).find(id);
    return {
      id: record.id,
      fields: record.fields as unknown as Item,
      createdTime: record.get('createdTime') as string,
    };
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
}

/**
 * Criar novo item
 */
export async function createItem(item: Item): Promise<AirtableRecord<Item>> {
  const base = getAirtableBase();
  
  const records = await base(TABLES.ITEMS).create([item] as any);
  const record = records[0];
  
  return {
    id: record.id,
    fields: record.fields as unknown as Item,
    createdTime: record.get('createdTime') as string,
  };
}

/**
 * Atualizar item
 */
export async function updateItem(id: string, updates: Partial<Item>): Promise<AirtableRecord<Item>> {
  const base = getAirtableBase();
  
  const records = await base(TABLES.ITEMS).update([{ id, fields: updates as any }]);
  const record = records[0];
  
  return {
    id: record.id,
    fields: record.fields as unknown as Item,
    createdTime: record.get('createdTime') as string,
  };
}

/**
 * Deletar item
 */
export async function deleteItem(id: string): Promise<boolean> {
  const base = getAirtableBase();
  
  try {
    await base(TABLES.ITEMS).destroy(id);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
}

// ==================== FUNÇÕES PARA RESERVAS ====================

/**
 * Buscar todas as reservas
 */
export async function getReservations(options?: {
  maxRecords?: number;
  view?: string;
  filterByFormula?: string;
}): Promise<AirtableRecord<Reservation>[]> {
  const base = getAirtableBase();
  const records: AirtableRecord<Reservation>[] = [];

  await base(TABLES.RESERVATIONS)
    .select({
      maxRecords: options?.maxRecords,
      view: options?.view,
      filterByFormula: options?.filterByFormula,
    })
    .eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push({
          id: record.id,
          fields: record.fields as unknown as Reservation,
          createdTime: record.get('createdTime') as string,
        });
      });
      fetchNextPage();
    });

  return records;
}

/**
 * Criar nova reserva
 */
export async function createReservation(reservation: Reservation): Promise<AirtableRecord<Reservation>> {
  const base = getAirtableBase();
  
  const records = await base(TABLES.RESERVATIONS).create([reservation] as any);
  const record = records[0];
  
  return {
    id: record.id,
    fields: record.fields as unknown as Reservation,
    createdTime: record.get('createdTime') as string,
  };
}

/**
 * Atualizar reserva
 */
export async function updateReservation(id: string, updates: Partial<Reservation>): Promise<AirtableRecord<Reservation>> {
  const base = getAirtableBase();
  
  const records = await base(TABLES.RESERVATIONS).update([{ id, fields: updates as any }]);
  const record = records[0];
  
  return {
    id: record.id,
    fields: record.fields as unknown as Reservation,
    createdTime: record.get('createdTime') as string,
  };
}

// ==================== FUNÇÕES PARA MANUTENÇÃO ====================

/**
 * Buscar todos os registros de manutenção
 */
export async function getMaintenance(options?: {
  maxRecords?: number;
  view?: string;
  filterByFormula?: string;
}): Promise<AirtableRecord<Maintenance>[]> {
  const base = getAirtableBase();
  const records: AirtableRecord<Maintenance>[] = [];

  await base(TABLES.MAINTENANCE)
    .select({
      maxRecords: options?.maxRecords,
      view: options?.view,
      filterByFormula: options?.filterByFormula,
    })
    .eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push({
          id: record.id,
          fields: record.fields as unknown as Maintenance,
          createdTime: record.get('createdTime') as string,
        });
      });
      fetchNextPage();
    });

  return records;
}

/**
 * Criar registro de manutenção
 */
export async function createMaintenance(maintenance: Maintenance): Promise<AirtableRecord<Maintenance>> {
  const base = getAirtableBase();
  
  const records = await base(TABLES.MAINTENANCE).create([maintenance] as any);
  const record = records[0];
  
  return {
    id: record.id,
    fields: record.fields as unknown as Maintenance,
    createdTime: record.get('createdTime') as string,
  };
}

// ==================== FUNÇÕES PARA FINANÇAS ====================

/**
 * Buscar todos os registros financeiros
 */
export async function getFinance(options?: {
  maxRecords?: number;
  view?: string;
  filterByFormula?: string;
}): Promise<AirtableRecord<Finance>[]> {
  const base = getAirtableBase();
  const records: AirtableRecord<Finance>[] = [];

  await base(TABLES.FINANCE)
    .select({
      maxRecords: options?.maxRecords,
      view: options?.view,
      filterByFormula: options?.filterByFormula,
    })
    .eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push({
          id: record.id,
          fields: record.fields as unknown as Finance,
          createdTime: record.get('createdTime') as string,
        });
      });
      fetchNextPage();
    });

  return records;
}

/**
 * Criar registro financeiro
 */
export async function createFinance(finance: Finance): Promise<AirtableRecord<Finance>> {
  const base = getAirtableBase();
  
  const records = await base(TABLES.FINANCE).create([finance] as any);
  const record = records[0];
  
  return {
    id: record.id,
    fields: record.fields as unknown as Finance,
    createdTime: record.get('createdTime') as string,
  };
}

/**
 * Calcular totais financeiros
 */
export async function getFinanceSummary(startDate?: string, endDate?: string) {
  let filterFormula = '';
  
  if (startDate && endDate) {
    filterFormula = `AND(IS_AFTER({date}, '${startDate}'), IS_BEFORE({date}, '${endDate}'))`;
  } else if (startDate) {
    filterFormula = `IS_AFTER({date}, '${startDate}')`;
  } else if (endDate) {
    filterFormula = `IS_BEFORE({date}, '${endDate}')`;
  }

  const records = await getFinance({
    filterByFormula: filterFormula || undefined,
  });

  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactions: records.length,
  };

  records.forEach((record) => {
    const amount = record.fields.amount || 0;
    if (record.fields.type === 'income') {
      summary.totalIncome += amount;
    } else if (record.fields.type === 'expense') {
      summary.totalExpense += amount;
    }
  });

  summary.balance = summary.totalIncome - summary.totalExpense;

  return summary;
}
