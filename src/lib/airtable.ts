import Airtable from 'airtable';

// Configuração do Airtable
export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tables?: {
    items?: string;
    reservations?: string;
    maintenance?: string;
    finance?: string;
    users?: string;
  };
}

// Configuração global (pode ser sobrescrita por funções individuais)
let globalConfig: AirtableConfig | null = null;

// Nomes padrão das tabelas
const DEFAULT_TABLE_NAMES = {
  ITEMS: 'Items',
  RESERVATIONS: 'Reservations',
  MAINTENANCE: 'Maintenance',
  FINANCE: 'Finance',
  USERS: 'Users',
};

// Cache do cliente Airtable
let airtableBase: Airtable.Base | null = null;
let currentConfigKey: string | null = null;

/**
 * Configura as credenciais do Airtable globalmente
 * 
 * Nota: Chamar esta função invalida o cache do cliente Airtable.
 * Use quando precisar trocar de credenciais ou base durante a execução.
 */
export function configureAirtable(config: AirtableConfig): void {
  globalConfig = config;
  // Limpar cache quando configuração muda
  airtableBase = null;
  currentConfigKey = null;
}

/**
 * Obtém a configuração atual (global ou padrão)
 * 
 * @throws {Error} Se nenhuma configuração global foi definida
 * @private
 */
function getConfig(): AirtableConfig {
  if (!globalConfig) {
    throw new Error(
      'Airtable not configured. Call configureAirtable() first or pass config to individual functions.'
    );
  }
  return globalConfig;
}

/**
 * Obtém os nomes das tabelas baseado na configuração
 */
export function getTableNames(config?: AirtableConfig) {
  const cfg = config || getConfig();
  return {
    ITEMS: cfg.tables?.items || DEFAULT_TABLE_NAMES.ITEMS,
    RESERVATIONS: cfg.tables?.reservations || DEFAULT_TABLE_NAMES.RESERVATIONS,
    MAINTENANCE: cfg.tables?.maintenance || DEFAULT_TABLE_NAMES.MAINTENANCE,
    FINANCE: cfg.tables?.finance || DEFAULT_TABLE_NAMES.FINANCE,
    USERS: cfg.tables?.users || DEFAULT_TABLE_NAMES.USERS,
  };
}

/**
 * Inicializa e retorna o cliente Airtable
 * 
 * @param config - Configuração opcional. Se não fornecida, usa a configuração global.
 * @throws {Error} Se as credenciais não estiverem configuradas
 */
export function getAirtableBase(config?: AirtableConfig): Airtable.Base {
  const cfg = config || getConfig();
  
  if (!cfg.apiKey || !cfg.baseId) {
    throw new Error(
      'Airtable credentials not configured. Please provide apiKey and baseId.'
    );
  }

  // Criar chave única para esta configuração (hash simples para evitar expor credenciais)
  const configKey = `${cfg.baseId}:${cfg.apiKey.substring(0, 8)}`;
  
  // Recriar base se configuração mudou
  if (!airtableBase || currentConfigKey !== configKey) {
    Airtable.configure({
      apiKey: cfg.apiKey,
    });
    airtableBase = Airtable.base(cfg.baseId);
    currentConfigKey = configKey;
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

export interface User {
  username: string;
  password: string; // hashed password
  role: 'admin' | 'user';
  name?: string;
  email?: string;
  createdAt?: string;
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
  config?: AirtableConfig;
}): Promise<AirtableRecord<Item>[]> {
  const base = getAirtableBase(options?.config);
  const tables = getTableNames(options?.config);
  const records: AirtableRecord<Item>[] = [];

  await base(tables.ITEMS)
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
export async function getItemById(id: string, config?: AirtableConfig): Promise<AirtableRecord<Item> | null> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  try {
    const record = await base(tables.ITEMS).find(id);
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
export async function createItem(item: Item, config?: AirtableConfig): Promise<AirtableRecord<Item>> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  const records = await base(tables.ITEMS).create([item] as any);
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
export async function updateItem(id: string, updates: Partial<Item>, config?: AirtableConfig): Promise<AirtableRecord<Item>> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  const records = await base(tables.ITEMS).update([{ id, fields: updates as any }]);
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
export async function deleteItem(id: string, config?: AirtableConfig): Promise<boolean> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  try {
    await base(tables.ITEMS).destroy(id);
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
  config?: AirtableConfig;
}): Promise<AirtableRecord<Reservation>[]> {
  const base = getAirtableBase(options?.config);
  const tables = getTableNames(options?.config);
  const records: AirtableRecord<Reservation>[] = [];

  await base(tables.RESERVATIONS)
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
export async function createReservation(reservation: Reservation, config?: AirtableConfig): Promise<AirtableRecord<Reservation>> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  const records = await base(tables.RESERVATIONS).create([reservation] as any);
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
export async function updateReservation(id: string, updates: Partial<Reservation>, config?: AirtableConfig): Promise<AirtableRecord<Reservation>> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  const records = await base(tables.RESERVATIONS).update([{ id, fields: updates as any }]);
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
  config?: AirtableConfig;
}): Promise<AirtableRecord<Maintenance>[]> {
  const base = getAirtableBase(options?.config);
  const tables = getTableNames(options?.config);
  const records: AirtableRecord<Maintenance>[] = [];

  await base(tables.MAINTENANCE)
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
export async function createMaintenance(maintenance: Maintenance, config?: AirtableConfig): Promise<AirtableRecord<Maintenance>> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  const records = await base(tables.MAINTENANCE).create([maintenance] as any);
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
  config?: AirtableConfig;
}): Promise<AirtableRecord<Finance>[]> {
  const base = getAirtableBase(options?.config);
  const tables = getTableNames(options?.config);
  const records: AirtableRecord<Finance>[] = [];

  await base(tables.FINANCE)
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
export async function createFinance(finance: Finance, config?: AirtableConfig): Promise<AirtableRecord<Finance>> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  const records = await base(tables.FINANCE).create([finance] as any);
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
export async function getFinanceSummary(startDate?: string, endDate?: string, config?: AirtableConfig) {
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
    config,
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

// ==================== FUNÇÕES PARA USUÁRIOS ====================

/**
 * Buscar todos os usuários
 */
export async function getUsers(options?: {
  maxRecords?: number;
  view?: string;
  filterByFormula?: string;
  config?: AirtableConfig;
}): Promise<AirtableRecord<User>[]> {
  const base = getAirtableBase(options?.config);
  const tables = getTableNames(options?.config);
  const records: AirtableRecord<User>[] = [];

  await base(tables.USERS)
    .select({
      maxRecords: options?.maxRecords,
      view: options?.view,
      filterByFormula: options?.filterByFormula,
    })
    .eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push({
          id: record.id,
          fields: record.fields as unknown as User,
          createdTime: record.get('createdTime') as string,
        });
      });
      fetchNextPage();
    });

  return records;
}

/**
 * Buscar usuário por username
 */
export async function getUserByUsername(username: string, config?: AirtableConfig): Promise<AirtableRecord<User> | null> {
  // Sanitize username to prevent formula injection
  const sanitizedUsername = username.replace(/'/g, "\\'");
  
  const users = await getUsers({
    filterByFormula: `{username} = '${sanitizedUsername}'`,
    maxRecords: 1,
    config,
  });
  
  return users.length > 0 ? users[0] : null;
}

/**
 * Criar novo usuário
 */
export async function createUser(user: User, config?: AirtableConfig): Promise<AirtableRecord<User>> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  const records = await base(tables.USERS).create([user] as any);
  const record = records[0];
  
  return {
    id: record.id,
    fields: record.fields as unknown as User,
    createdTime: record.get('createdTime') as string,
  };
}

/**
 * Atualizar usuário
 */
export async function updateUser(id: string, updates: Partial<User>, config?: AirtableConfig): Promise<AirtableRecord<User>> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  const records = await base(tables.USERS).update([{ id, fields: updates as any }]);
  const record = records[0];
  
  return {
    id: record.id,
    fields: record.fields as unknown as User,
    createdTime: record.get('createdTime') as string,
  };
}

/**
 * Deletar usuário
 */
export async function deleteUser(id: string, config?: AirtableConfig): Promise<boolean> {
  const base = getAirtableBase(config);
  const tables = getTableNames(config);
  
  try {
    await base(tables.USERS).destroy(id);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}
