/**
 * Cliente D1 para operações de banco de dados
 * Substitui a integração anterior com Airtable
 * 
 * Suporta operações CRUD para:
 * - Items (itens para aluguel)
 * - Reservations (reservas de clientes)
 * - Maintenance (manutenções)
 * - Financial Records (controle financeiro)
 * - Portfolio Images (imagens do portfólio)
 */

import { generateCustomId } from './generateId';

// Interface para o ambiente do Cloudflare
interface Env {
  DB: D1Database;
}

// ==================== TIPOS/INTERFACES ====================

export interface Item {
  id: number;
  custom_id?: string; // EST-A001, EST-A002, etc.
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image_url?: string;
  show_in_catalog?: number; // 1 = show in catalog, 0 = hide
}

export interface ItemInput {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  show_in_catalog?: number;
  custom_id?: string; // Optional - will be auto-generated if not provided
}

export interface PortfolioImage {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  display_order: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioImageInput {
  title: string;
  description?: string;
  image_url: string;
  display_order?: number;
  is_active?: number;
}

export interface Reservation {
  id: number;
  custom_id?: string; // RES-A001, RES-A002, etc.
  item_id: number;
  kit_id?: number;  // Optional: if reserving a kit instead of item
  quantity: number; // Quantity of items/kits reserved
  customer_name: string;
  customer_email?: string;
  date_from: string; // YYYY-MM-DD
  date_to: string;   // YYYY-MM-DD
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface ReservationInput {
  item_id?: number;  // Optional if kit_id is provided
  kit_id?: number;   // Optional if item_id is provided
  quantity?: number; // Default to 1 if not provided
  customer_name: string;
  customer_email?: string;
  date_from: string;
  date_to: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  custom_id?: string; // Optional - will be auto-generated if not provided
}

export interface MaintenanceRecord {
  id: number;
  item_id: number;
  description: string;
  date: string; // YYYY-MM-DD
  cost?: number;
}

export interface MaintenanceInput {
  item_id: number;
  description: string;
  date: string;
  cost?: number;
}

export interface FinancialRecord {
  id: number;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface FinancialInput {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

// ==================== KITS ====================

export interface Kit {
  id: number;
  custom_id?: string; // KIT-A001, KIT-A002, etc.
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface KitInput {
  name: string;
  description?: string;
  price: number;
  is_active?: number;
  custom_id?: string; // Optional - will be auto-generated if not provided
}

export interface KitItem {
  id: number;
  kit_id: number;
  item_id: number;
  quantity: number;
}

export interface KitItemInput {
  kit_id: number;
  item_id: number;
  quantity: number;
}

export interface KitWithItems extends Kit {
  items: Array<{
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
  }>;
}

// Type alias for kit item with name
type KitItemWithName = {
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
};

// Type for kit items query result
interface KitItemQueryResult {
  kit_id: number;
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
}

export interface ReservationItem {
  id: number;
  reservation_id: number;
  item_id: number;
  quantity: number;
  date_from: string;
  date_to: string;
}

export interface ReservationItemInput {
  reservation_id: number;
  item_id: number;
  quantity: number;
  date_from: string;
  date_to: string;
}

// ==================== ITEMS (ITENS) ====================

/**
 * Busca todos os itens com opções de filtro
 */
export async function getItems(
  db: D1Database,
  options?: {
    status?: 'available' | 'reserved' | 'maintenance';
    catalogOnly?: boolean; // Filtrar apenas itens do catálogo
    maxRecords?: number;
  }
): Promise<Item[]> {
  let query = 'SELECT * FROM items';
  const params: any[] = [];
  const conditions: string[] = [];

  // Filtrar apenas itens do catálogo
  // Note: The OR IS NULL is removed as try-catch handles missing column
  if (options?.catalogOnly) {
    conditions.push('show_in_catalog = 1');
  }

  // Filtrar por quantidade (disponível se quantity > 0)
  if (options?.status === 'available') {
    conditions.push('quantity > 0');
  } else if (options?.status === 'maintenance') {
    // Items em manutenção são aqueles que estão em manutenção ativa
    conditions.push(`id IN (
      SELECT DISTINCT item_id FROM maintenance 
      WHERE date <= date('now') AND (
        SELECT COUNT(*) FROM maintenance m2 
        WHERE m2.item_id = maintenance.item_id AND m2.date > date('now')
      ) > 0
    )`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Adicionar limite
  if (options?.maxRecords) {
    query += ` LIMIT ${options.maxRecords}`;
  }

  try {
    const result = await db.prepare(query).all();
    return (result.results as unknown as Item[]) || [];
  } catch (error: any) {
    // If error is due to missing column, retry without show_in_catalog filter
    if (error.message && (error.message.toLowerCase().includes('column') || error.message.includes('show_in_catalog'))) {
      console.warn('show_in_catalog column not found, fetching all items');
      const fallbackQuery = 'SELECT * FROM items' + (options?.maxRecords ? ` LIMIT ${options.maxRecords}` : '');
      const result = await db.prepare(fallbackQuery).all();
      return (result.results as unknown as Item[]) || [];
    }
    throw error;
  }
}

/**
 * Busca um item específico pelo ID
 */
export async function getItemById(
  db: D1Database,
  itemId: number
): Promise<Item | null> {
  const result = await db
    .prepare('SELECT * FROM items WHERE id = ?')
    .bind(itemId)
    .first();
  return result ? (result as unknown as Item) : null;
}

/**
 * Cria um novo item
 * Note: Requires properly formatted custom_id values in database (EST-A###)
 * for correct sequencing. Any existing IDs with different formats will be ignored.
 */
export async function createItem(
  db: D1Database,
  item: ItemInput
): Promise<Item> {
  // Generate custom_id if not provided
  let customId = item.custom_id;
  if (!customId) {
    try {
      // Get the last custom_id to generate the next one
      // Note: Lexicographic sort works correctly because IDs are zero-padded (EST-A001, EST-A002, etc.)
      // IDs with incorrect format (e.g., EST-A1, EST-A12345) will be ignored by generateCustomId
      const lastItem = await db
        .prepare('SELECT custom_id FROM items WHERE custom_id IS NOT NULL ORDER BY custom_id DESC LIMIT 1')
        .first<{ custom_id: string }>();
      
      customId = generateCustomId('EST', lastItem?.custom_id || null);
    } catch (error) {
      // If custom_id column doesn't exist, generate a new ID anyway
      customId = generateCustomId('EST', null);
    }
  }

  try {
    // Try to insert with all columns including show_in_catalog and custom_id
    const result = await db
      .prepare(
        'INSERT INTO items (name, description, price, quantity, show_in_catalog, custom_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(
        item.name,
        item.description || null,
        item.price,
        item.quantity,
        item.show_in_catalog !== undefined ? item.show_in_catalog : 1,
        customId
      )
      .first();
    return result as unknown as Item;
  } catch (error: any) {
    // If error is due to missing columns, try without them
    // Check for column-related errors more broadly
    const isColumnError = error.message && (
      error.message.toLowerCase().includes('column') ||
      error.message.includes('show_in_catalog') ||
      error.message.includes('custom_id')
    );
    
    if (isColumnError) {
      console.warn('Some columns not found, inserting with basic fields only');
      const result = await db
        .prepare(
          'INSERT INTO items (name, description, price, quantity) VALUES (?, ?, ?, ?) RETURNING *'
        )
        .bind(
          item.name,
          item.description || null,
          item.price,
          item.quantity
        )
        .first();
      return result as unknown as Item;
    }
    throw error;
  }
}

/**
 * Atualiza um item existente
 */
export async function updateItem(
  db: D1Database,
  itemId: number,
  updates: Partial<ItemInput>
): Promise<Item | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(updates.price);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }
  if (updates.show_in_catalog !== undefined) {
    fields.push('show_in_catalog = ?');
    values.push(updates.show_in_catalog);
  }

  if (fields.length === 0) {
    return getItemById(db, itemId);
  }

  values.push(itemId);
  const query = `UPDATE items SET ${fields.join(', ')} WHERE id = ? RETURNING *`;

  const result = await db.prepare(query).bind(...values).first();
  return result ? (result as unknown as Item) : null;
}

/**
 * Deleta um item
 */
export async function deleteItem(db: D1Database, itemId: number): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM items WHERE id = ?')
    .bind(itemId)
    .run();
  return result.success;
}

// ==================== RESERVATIONS (RESERVAS) ====================

/**
 * Busca todas as reservas com opções de filtro
 */
export async function getReservations(
  db: D1Database,
  options?: {
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    maxRecords?: number;
  }
): Promise<Reservation[]> {
  let query = 'SELECT * FROM reservations';
  const params: any[] = [];

  if (options?.status) {
    query += ' WHERE status = ?';
    params.push(options.status);
  }

  if (options?.maxRecords) {
    query += ` LIMIT ${options.maxRecords}`;
  }

  const result = await db.prepare(query).bind(...params).all();
  return (result.results as unknown as Reservation[]) || [];
}

/**
 * Busca uma reserva específica pelo ID
 */
export async function getReservationById(
  db: D1Database,
  reservationId: number
): Promise<Reservation | null> {
  const result = await db
    .prepare('SELECT * FROM reservations WHERE id = ?')
    .bind(reservationId)
    .first();
  return result ? (result as unknown as Reservation) : null;
}

/**
 * Cria uma nova reserva
 * Suporta reserva de item individual ou kit
 * Se kit_id for fornecido, cria automaticamente os reservation_items
 */
export async function createReservation(
  db: D1Database,
  reservation: ReservationInput
): Promise<Reservation> {
  const status = reservation.status || 'pending';
  const quantity = reservation.quantity || 1;
  
  // Validação: deve ter item_id OU kit_id, não ambos
  if (!reservation.item_id && !reservation.kit_id) {
    throw new Error('Deve fornecer item_id ou kit_id');
  }

  // Generate custom_id if not provided
  let customId = reservation.custom_id;
  if (!customId) {
    try {
      // Get the last custom_id to generate the next one
      // Note: Lexicographic sort works correctly because IDs are zero-padded (RES-A001, RES-A002, etc.)
      const lastReservation = await db
        .prepare('SELECT custom_id FROM reservations WHERE custom_id IS NOT NULL ORDER BY custom_id DESC LIMIT 1')
        .first<{ custom_id: string }>();
      
      customId = generateCustomId('RES', lastReservation?.custom_id || null);
    } catch (error) {
      // If custom_id column doesn't exist, generate a new ID anyway
      customId = generateCustomId('RES', null);
    }
  }

  let newReservation: Reservation;

  try {
    // Try to insert with custom_id
    const result = await db
      .prepare(
        'INSERT INTO reservations (item_id, kit_id, quantity, customer_name, customer_email, date_from, date_to, status, custom_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(
        reservation.item_id || null,
        reservation.kit_id || null,
        quantity,
        reservation.customer_name,
        reservation.customer_email || null,
        reservation.date_from,
        reservation.date_to,
        status,
        customId
      )
      .first();
    newReservation = result as unknown as Reservation;
  } catch (error: any) {
    // If error is due to missing custom_id column, try without it
    const isColumnError = error.message && (
      error.message.toLowerCase().includes('column') ||
      error.message.includes('custom_id')
    );
    
    if (isColumnError) {
      console.warn('custom_id column not found, inserting without it');
      const result = await db
        .prepare(
          'INSERT INTO reservations (item_id, kit_id, quantity, customer_name, customer_email, date_from, date_to, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
        )
        .bind(
          reservation.item_id || null,
          reservation.kit_id || null,
          quantity,
          reservation.customer_name,
          reservation.customer_email || null,
          reservation.date_from,
          reservation.date_to,
          status
        )
        .first();
      newReservation = result as unknown as Reservation;
    } else {
      throw error;
    }
  }

  // Se for reserva de kit, criar entradas em reservation_items
  if (reservation.kit_id) {
    await createReservationItemsForKit(
      db,
      newReservation.id,
      reservation.kit_id,
      reservation.date_from,
      reservation.date_to,
      quantity
    );
  } else if (reservation.item_id) {
    // Se for item individual, também criar entrada em reservation_items
    await db
      .prepare(
        'INSERT INTO reservation_items (reservation_id, item_id, quantity, date_from, date_to) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        newReservation.id,
        reservation.item_id,
        quantity,
        reservation.date_from,
        reservation.date_to
      )
      .run();
  }

  return newReservation;
}

/**
 * Atualiza uma reserva existente
 */
export async function updateReservation(
  db: D1Database,
  reservationId: number,
  updates: Partial<ReservationInput>
): Promise<Reservation | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.item_id !== undefined) {
    fields.push('item_id = ?');
    values.push(updates.item_id);
  }
  if (updates.kit_id !== undefined) {
    fields.push('kit_id = ?');
    values.push(updates.kit_id);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }
  if (updates.customer_name !== undefined) {
    fields.push('customer_name = ?');
    values.push(updates.customer_name);
  }
  if (updates.customer_email !== undefined) {
    fields.push('customer_email = ?');
    values.push(updates.customer_email);
  }
  if (updates.date_from !== undefined) {
    fields.push('date_from = ?');
    values.push(updates.date_from);
  }
  if (updates.date_to !== undefined) {
    fields.push('date_to = ?');
    values.push(updates.date_to);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }

  if (fields.length === 0) {
    return getReservationById(db, reservationId);
  }

  values.push(reservationId);
  const query = `UPDATE reservations SET ${fields.join(', ')} WHERE id = ? RETURNING *`;

  const result = await db.prepare(query).bind(...values).first();
  return result ? (result as unknown as Reservation) : null;
}

/**
 * Deleta uma reserva
 */
export async function deleteReservation(
  db: D1Database,
  reservationId: number
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM reservations WHERE id = ?')
    .bind(reservationId)
    .run();
  return result.success;
}

// ==================== MAINTENANCE (MANUTENÇÃO) ====================

/**
 * Busca todos os registros de manutenção
 */
export async function getMaintenance(
  db: D1Database,
  options?: { maxRecords?: number }
): Promise<MaintenanceRecord[]> {
  let query = 'SELECT * FROM maintenance ORDER BY date DESC';

  if (options?.maxRecords) {
    query += ` LIMIT ${options.maxRecords}`;
  }

  const result = await db.prepare(query).all();
  return (result.results as unknown as MaintenanceRecord[]) || [];
}

/**
 * Busca um registro de manutenção pelo ID
 */
export async function getMaintenanceById(
  db: D1Database,
  maintenanceId: number
): Promise<MaintenanceRecord | null> {
  const result = await db
    .prepare('SELECT * FROM maintenance WHERE id = ?')
    .bind(maintenanceId)
    .first();
  return result ? (result as unknown as MaintenanceRecord) : null;
}

/**
 * Busca manutenções de um item específico
 */
export async function getMaintenanceByItemId(
  db: D1Database,
  itemId: number
): Promise<MaintenanceRecord[]> {
  const result = await db
    .prepare('SELECT * FROM maintenance WHERE item_id = ? ORDER BY date DESC')
    .bind(itemId)
    .all();
  return (result.results as unknown as MaintenanceRecord[]) || [];
}

/**
 * Cria um novo registro de manutenção
 */
export async function createMaintenance(
  db: D1Database,
  maintenance: MaintenanceInput
): Promise<MaintenanceRecord> {
  const result = await db
    .prepare(
      'INSERT INTO maintenance (item_id, description, date, cost) VALUES (?, ?, ?, ?) RETURNING *'
    )
    .bind(
      maintenance.item_id,
      maintenance.description,
      maintenance.date,
      maintenance.cost || null
    )
    .first();
  return result as unknown as MaintenanceRecord;
}

/**
 * Atualiza um registro de manutenção
 */
export async function updateMaintenance(
  db: D1Database,
  maintenanceId: number,
  updates: Partial<MaintenanceInput>
): Promise<MaintenanceRecord | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.item_id !== undefined) {
    fields.push('item_id = ?');
    values.push(updates.item_id);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  if (updates.cost !== undefined) {
    fields.push('cost = ?');
    values.push(updates.cost);
  }

  if (fields.length === 0) {
    return getMaintenanceById(db, maintenanceId);
  }

  values.push(maintenanceId);
  const query = `UPDATE maintenance SET ${fields.join(', ')} WHERE id = ? RETURNING *`;

  const result = await db.prepare(query).bind(...values).first();
  return result ? (result as unknown as MaintenanceRecord) : null;
}

/**
 * Deleta um registro de manutenção
 */
export async function deleteMaintenance(
  db: D1Database,
  maintenanceId: number
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM maintenance WHERE id = ?')
    .bind(maintenanceId)
    .run();
  return result.success;
}

// ==================== FINANCIAL RECORDS (FINANÇAS) ====================

/**
 * Busca todos os registros financeiros
 */
export async function getFinancial(
  db: D1Database,
  options?: { maxRecords?: number }
): Promise<FinancialRecord[]> {
  let query = 'SELECT * FROM financial_records ORDER BY date DESC';

  if (options?.maxRecords) {
    query += ` LIMIT ${options.maxRecords}`;
  }

  const result = await db.prepare(query).all();
  return (result.results as unknown as FinancialRecord[]) || [];
}

/**
 * Busca um registro financeiro pelo ID
 */
export async function getFinancialById(
  db: D1Database,
  recordId: number
): Promise<FinancialRecord | null> {
  const result = await db
    .prepare('SELECT * FROM financial_records WHERE id = ?')
    .bind(recordId)
    .first();
  return result ? (result as unknown as FinancialRecord) : null;
}

/**
 * Cria um novo registro financeiro
 */
export async function createFinancial(
  db: D1Database,
  record: FinancialInput
): Promise<FinancialRecord> {
  const result = await db
    .prepare(
      'INSERT INTO financial_records (type, description, amount, date) VALUES (?, ?, ?, ?) RETURNING *'
    )
    .bind(record.type, record.description, record.amount, record.date)
    .first();
  return result as unknown as FinancialRecord;
}

/**
 * Atualiza um registro financeiro
 */
export async function updateFinancial(
  db: D1Database,
  recordId: number,
  updates: Partial<FinancialInput>
): Promise<FinancialRecord | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.amount !== undefined) {
    fields.push('amount = ?');
    values.push(updates.amount);
  }
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }

  if (fields.length === 0) {
    return getFinancialById(db, recordId);
  }

  values.push(recordId);
  const query = `UPDATE financial_records SET ${fields.join(', ')} WHERE id = ? RETURNING *`;

  const result = await db.prepare(query).bind(...values).first();
  return result ? (result as unknown as FinancialRecord) : null;
}

/**
 * Deleta um registro financeiro
 */
export async function deleteFinancial(
  db: D1Database,
  recordId: number
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM financial_records WHERE id = ?')
    .bind(recordId)
    .run();
  return result.success;
}

/**
 * Gera um resumo financeiro para um período
 */
export async function getFinancialSummary(
  db: D1Database,
  startDate?: string,
  endDate?: string
): Promise<FinancialSummary> {
  let query = 'SELECT type, SUM(amount) as total FROM financial_records';
  const params: any[] = [];

  if (startDate || endDate) {
    const conditions: string[] = [];
    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' GROUP BY type';

  const result = await db.prepare(query).bind(...params).all();
  const records = result.results as any[];

  let totalIncome = 0;
  let totalExpense = 0;

  records.forEach((record) => {
    if (record.type === 'income') {
      totalIncome = record.total || 0;
    } else if (record.type === 'expense') {
      totalExpense = record.total || 0;
    }
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    period: {
      startDate: startDate || 'all-time',
      endDate: endDate || 'all-time',
    },
  };
}

// ==================== PORTFOLIO IMAGES ====================

/**
 * Busca todas as imagens do portfólio
 */
export async function getPortfolioImages(
  db: D1Database,
  options?: {
    activeOnly?: boolean;
    maxRecords?: number;
  }
): Promise<PortfolioImage[]> {
  let query = 'SELECT * FROM portfolio_images';
  const params: (string | number)[] = [];
  
  if (options?.activeOnly) {
    query += ' WHERE is_active = 1';
  }
  
  query += ' ORDER BY display_order ASC, created_at DESC';
  
  if (options?.maxRecords) {
    query += ' LIMIT ?';
    params.push(options.maxRecords);
  }
  
  const result = await db.prepare(query).bind(...params).all();
  return (result.results as unknown as PortfolioImage[]) || [];
}

/**
 * Busca uma imagem do portfólio pelo ID
 */
export async function getPortfolioImageById(
  db: D1Database,
  imageId: number
): Promise<PortfolioImage | null> {
  const result = await db
    .prepare('SELECT * FROM portfolio_images WHERE id = ?')
    .bind(imageId)
    .first();
  return result ? (result as unknown as PortfolioImage) : null;
}

/**
 * Cria uma nova imagem do portfólio
 */
export async function createPortfolioImage(
  db: D1Database,
  image: PortfolioImageInput
): Promise<PortfolioImage> {
  const displayOrder = image.display_order ?? 0;
  const isActive = image.is_active ?? 1;
  
  const result = await db
    .prepare(
      'INSERT INTO portfolio_images (title, description, image_url, display_order, is_active) VALUES (?, ?, ?, ?, ?) RETURNING *'
    )
    .bind(
      image.title,
      image.description || null,
      image.image_url,
      displayOrder,
      isActive
    )
    .first();
  return result as unknown as PortfolioImage;
}

/**
 * Atualiza uma imagem do portfólio
 */
export async function updatePortfolioImage(
  db: D1Database,
  imageId: number,
  updates: Partial<PortfolioImageInput>
): Promise<PortfolioImage | null> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(updates.image_url);
  }
  if (updates.display_order !== undefined) {
    fields.push('display_order = ?');
    values.push(updates.display_order);
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active);
  }
  
  if (fields.length === 0) {
    return getPortfolioImageById(db, imageId);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(imageId);
  const query = `UPDATE portfolio_images SET ${fields.join(', ')} WHERE id = ? RETURNING *`;
  
  const result = await db.prepare(query).bind(...values).first();
  return result ? (result as unknown as PortfolioImage) : null;
}

/**
 * Deleta uma imagem do portfólio
 */
export async function deletePortfolioImage(
  db: D1Database,
  imageId: number
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM portfolio_images WHERE id = ?')
    .bind(imageId)
    .run();
  return result.success;
}

// ==================== SITE SETTINGS ====================

export interface SiteSettings {
  id: number;
  company_name: string;
  company_description: string;
  phone: string;
  email: string;
  address: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
  updated_at?: string;
}

export interface SiteSettingsInput {
  company_name?: string;
  company_description?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
}

/**
 * Busca as configurações do site
 */
export async function getSiteSettings(
  db: D1Database
): Promise<SiteSettings | null> {
  const result = await db
    .prepare('SELECT * FROM site_settings WHERE id = 1')
    .first();
  return result ? (result as unknown as SiteSettings) : null;
}

/**
 * Atualiza as configurações do site
 */
export async function updateSiteSettings(
  db: D1Database,
  updates: SiteSettingsInput
): Promise<SiteSettings | null> {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  
  if (updates.company_name !== undefined) {
    fields.push('company_name = ?');
    values.push(updates.company_name);
  }
  if (updates.company_description !== undefined) {
    fields.push('company_description = ?');
    values.push(updates.company_description);
  }
  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.address !== undefined) {
    fields.push('address = ?');
    values.push(updates.address);
  }
  if (updates.facebook_url !== undefined) {
    fields.push('facebook_url = ?');
    values.push(updates.facebook_url || null);
  }
  if (updates.instagram_url !== undefined) {
    fields.push('instagram_url = ?');
    values.push(updates.instagram_url || null);
  }
  if (updates.whatsapp_url !== undefined) {
    fields.push('whatsapp_url = ?');
    values.push(updates.whatsapp_url || null);
  }
  
  if (fields.length === 0) {
    return getSiteSettings(db);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  const query = `UPDATE site_settings SET ${fields.join(', ')} WHERE id = 1 RETURNING *`;
  
  const result = await db.prepare(query).bind(...values).first();
  return result ? (result as unknown as SiteSettings) : null;
}

// ==================== KITS ====================

/**
 * Busca todos os kits
 */
export async function getKits(
  db: D1Database,
  options?: {
    activeOnly?: boolean;
    maxRecords?: number;
  }
): Promise<Kit[]> {
  let query = 'SELECT * FROM kits';
  const params: any[] = [];

  if (options?.activeOnly) {
    query += ' WHERE is_active = 1';
  }

  query += ' ORDER BY name';

  if (options?.maxRecords) {
    query += ` LIMIT ${options.maxRecords}`;
  }

  const result = await db.prepare(query).bind(...params).all();
  return (result.results as unknown as Kit[]) || [];
}

/**
 * Busca um kit específico pelo ID
 */
export async function getKitById(
  db: D1Database,
  kitId: number
): Promise<Kit | null> {
  const result = await db
    .prepare('SELECT * FROM kits WHERE id = ?')
    .bind(kitId)
    .first();
  return result ? (result as unknown as Kit) : null;
}

/**
 * Busca um kit com seus itens
 */
export async function getKitWithItems(
  db: D1Database,
  kitId: number
): Promise<KitWithItems | null> {
  const kit = await getKitById(db, kitId);
  if (!kit) return null;

  const itemsResult = await db
    .prepare(`
      SELECT 
        ki.id,
        ki.item_id,
        ki.quantity,
        i.name as item_name
      FROM kit_items ki
      JOIN items i ON ki.item_id = i.id
      WHERE ki.kit_id = ?
      ORDER BY i.name
    `)
    .bind(kitId)
    .all();

  const items = itemsResult.results.map((row: any) => ({
    id: row.id,
    item_id: row.item_id,
    item_name: row.item_name,
    quantity: row.quantity,
  }));

  return {
    ...kit,
    items,
  };
}

/**
 * Fetches all kits with their items
 */
export async function getKitsWithItems(
  db: D1Database,
  options?: {
    activeOnly?: boolean;
    maxRecords?: number;
  }
): Promise<KitWithItems[]> {
  // First, get all kits
  const kits = await getKits(db, options);
  
  if (kits.length === 0) {
    return [];
  }
  
  // Get all kit IDs
  const kitIds = kits.map(kit => kit.id);
  
  // Fetch all kit items in a single query
  const kitItemsQuery = `
    SELECT 
      ki.kit_id,
      ki.id,
      ki.item_id,
      ki.quantity,
      i.name as item_name
    FROM kit_items ki
    JOIN items i ON ki.item_id = i.id
    WHERE ki.kit_id IN (${kitIds.map(() => '?').join(',')})
    ORDER BY ki.kit_id, i.name
  `;
  
  const itemsResult = await db.prepare(kitItemsQuery).bind(...kitIds).all();
  
  // Group items by kit_id
  const itemsByKitId: { [kitId: number]: KitItemWithName[] } = {};
  for (const row of itemsResult.results) {
    const kitItemRow = row as unknown as KitItemQueryResult;
    if (!itemsByKitId[kitItemRow.kit_id]) {
      itemsByKitId[kitItemRow.kit_id] = [];
    }
    itemsByKitId[kitItemRow.kit_id].push({
      id: kitItemRow.id,
      item_id: kitItemRow.item_id,
      item_name: kitItemRow.item_name,
      quantity: kitItemRow.quantity,
    });
  }
  
  // Combine kits with their items
  return kits.map(kit => ({
    ...kit,
    items: itemsByKitId[kit.id] || [],
  }));
}

/**
 * Cria um novo kit
 */
export async function createKit(
  db: D1Database,
  kit: KitInput
): Promise<Kit> {
  // Generate custom_id if not provided
  let customId = kit.custom_id;
  if (!customId) {
    try {
      // Get the last custom_id to generate the next one
      // Note: Lexicographic sort works correctly because IDs are zero-padded (KIT-A001, KIT-A002, etc.)
      const lastKit = await db
        .prepare('SELECT custom_id FROM kits WHERE custom_id IS NOT NULL ORDER BY custom_id DESC LIMIT 1')
        .first<{ custom_id: string }>();
      
      customId = generateCustomId('KIT', lastKit?.custom_id || null);
    } catch (error) {
      // If custom_id column doesn't exist, generate a new ID anyway
      customId = generateCustomId('KIT', null);
    }
  }

  try {
    // Try to insert with custom_id
    const result = await db
      .prepare(
        'INSERT INTO kits (name, description, price, is_active, custom_id) VALUES (?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(
        kit.name,
        kit.description || null,
        kit.price,
        kit.is_active !== undefined ? kit.is_active : 1,
        customId
      )
      .first();
    return result as unknown as Kit;
  } catch (error: any) {
    // If error is due to missing custom_id column, try without it
    const isColumnError = error.message && (
      error.message.toLowerCase().includes('column') ||
      error.message.includes('custom_id')
    );
    
    if (isColumnError) {
      console.warn('custom_id column not found, inserting without it');
      const result = await db
        .prepare(
          'INSERT INTO kits (name, description, price, is_active) VALUES (?, ?, ?, ?) RETURNING *'
        )
        .bind(
          kit.name,
          kit.description || null,
          kit.price,
          kit.is_active !== undefined ? kit.is_active : 1
        )
        .first();
      return result as unknown as Kit;
    }
    throw error;
  }
}

/**
 * Atualiza um kit existente
 */
export async function updateKit(
  db: D1Database,
  kitId: number,
  updates: Partial<KitInput>
): Promise<Kit | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(updates.price);
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active);
  }

  if (fields.length === 0) {
    return getKitById(db, kitId);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(kitId);

  const query = `UPDATE kits SET ${fields.join(', ')} WHERE id = ? RETURNING *`;
  const result = await db.prepare(query).bind(...values).first();
  return result ? (result as unknown as Kit) : null;
}

/**
 * Deleta um kit
 */
export async function deleteKit(db: D1Database, kitId: number): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM kits WHERE id = ?')
    .bind(kitId)
    .run();
  return result.success;
}

/**
 * Adiciona um item a um kit
 */
export async function addItemToKit(
  db: D1Database,
  input: KitItemInput
): Promise<KitItem> {
  const result = await db
    .prepare(
      'INSERT INTO kit_items (kit_id, item_id, quantity) VALUES (?, ?, ?) RETURNING *'
    )
    .bind(input.kit_id, input.item_id, input.quantity)
    .first();
  return result as unknown as KitItem;
}

/**
 * Remove um item de um kit
 */
export async function removeItemFromKit(
  db: D1Database,
  kitItemId: number
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM kit_items WHERE id = ?')
    .bind(kitItemId)
    .run();
  return result.success;
}

/**
 * Atualiza a quantidade de um item no kit
 */
export async function updateKitItem(
  db: D1Database,
  kitItemId: number,
  quantity: number
): Promise<KitItem | null> {
  const result = await db
    .prepare('UPDATE kit_items SET quantity = ? WHERE id = ? RETURNING *')
    .bind(quantity, kitItemId)
    .first();
  return result ? (result as unknown as KitItem) : null;
}

/**
 * Busca os itens de um kit
 */
export async function getKitItems(
  db: D1Database,
  kitId: number
): Promise<KitItem[]> {
  const result = await db
    .prepare('SELECT * FROM kit_items WHERE kit_id = ?')
    .bind(kitId)
    .all();
  return (result.results as unknown as KitItem[]) || [];
}

/**
 * Verifica disponibilidade de um kit para um período
 * Retorna true se todos os itens do kit estão disponíveis nas quantidades necessárias
 */
export async function checkKitAvailability(
  db: D1Database,
  kitId: number,
  dateFrom: string,
  dateTo: string,
  quantityNeeded: number = 1
): Promise<{ available: boolean; unavailableItems: string[] }> {
  const kitItems = await getKitItems(db, kitId);
  const unavailableItems: string[] = [];

  for (const kitItem of kitItems) {
    const item = await getItemById(db, kitItem.item_id);
    if (!item) continue;

    // Quantidade total necessária para o kit
    const totalNeeded = kitItem.quantity * quantityNeeded;

    // Buscar reservas existentes que se sobrepõem com o período
    const reservedResult = await db
      .prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total_reserved
        FROM reservation_items
        WHERE item_id = ?
          AND (
            (date_from <= ? AND date_to >= ?) OR
            (date_from <= ? AND date_to >= ?) OR
            (date_from >= ? AND date_to <= ?)
          )
      `)
      .bind(
        kitItem.item_id,
        dateFrom, dateFrom,
        dateTo, dateTo,
        dateFrom, dateTo
      )
      .first();

    const totalReserved = (reservedResult as any)?.total_reserved || 0;
    const available = item.quantity - totalReserved;

    if (available < totalNeeded) {
      unavailableItems.push(item.name);
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems,
  };
}

/**
 * Cria itens de reserva para um kit
 * Quando um kit é reservado, cria entradas em reservation_items para cada item do kit
 */
export async function createReservationItemsForKit(
  db: D1Database,
  reservationId: number,
  kitId: number,
  dateFrom: string,
  dateTo: string,
  quantity: number = 1
): Promise<void> {
  const kitItems = await getKitItems(db, kitId);

  for (const kitItem of kitItems) {
    await db
      .prepare(
        'INSERT INTO reservation_items (reservation_id, item_id, quantity, date_from, date_to) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        reservationId,
        kitItem.item_id,
        kitItem.quantity * quantity,
        dateFrom,
        dateTo
      )
      .run();
  }
}

/**
 * Busca itens de uma reserva
 */
export async function getReservationItems(
  db: D1Database,
  reservationId: number
): Promise<ReservationItem[]> {
  const result = await db
    .prepare('SELECT * FROM reservation_items WHERE reservation_id = ?')
    .bind(reservationId)
    .all();
  return (result.results as unknown as ReservationItem[]) || [];
}

/**
 * Verifica disponibilidade de um item para um período
 */
export async function checkItemAvailability(
  db: D1Database,
  itemId: number,
  dateFrom: string,
  dateTo: string,
  quantityNeeded: number = 1
): Promise<{ available: boolean; quantityAvailable: number }> {
  const item = await getItemById(db, itemId);
  if (!item) {
    return { available: false, quantityAvailable: 0 };
  }

  // Buscar reservas existentes que se sobrepõem com o período
  const reservedResult = await db
    .prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total_reserved
      FROM reservation_items
      WHERE item_id = ?
        AND (
          (date_from <= ? AND date_to >= ?) OR
          (date_from <= ? AND date_to >= ?) OR
          (date_from >= ? AND date_to <= ?)
        )
    `)
    .bind(
      itemId,
      dateFrom, dateFrom,
      dateTo, dateTo,
      dateFrom, dateTo
    )
    .first();

  const totalReserved = (reservedResult as any)?.total_reserved || 0;
  const quantityAvailable = item.quantity - totalReserved;

  return {
    available: quantityAvailable >= quantityNeeded,
    quantityAvailable: Math.max(0, quantityAvailable),
  };
}
