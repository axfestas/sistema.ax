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

// Interface para o ambiente do Cloudflare
interface Env {
  DB: D1Database;
}

// ==================== TIPOS/INTERFACES ====================

export interface Item {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface ItemInput {
  name: string;
  description?: string;
  price: number;
  quantity: number;
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
  item_id: number;
  customer_name: string;
  customer_email?: string;
  date_from: string; // YYYY-MM-DD
  date_to: string;   // YYYY-MM-DD
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface ReservationInput {
  item_id: number;
  customer_name: string;
  customer_email?: string;
  date_from: string;
  date_to: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
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

// ==================== ITEMS (ITENS) ====================

/**
 * Busca todos os itens com opções de filtro
 */
export async function getItems(
  db: D1Database,
  options?: {
    status?: 'available' | 'reserved' | 'maintenance';
    maxRecords?: number;
  }
): Promise<Item[]> {
  let query = 'SELECT * FROM items';
  const params: any[] = [];

  // Filtrar por quantidade (disponível se quantity > 0)
  if (options?.status === 'available') {
    query += ' WHERE quantity > 0';
  } else if (options?.status === 'maintenance') {
    // Items em manutenção são aqueles que estão em manutenção ativa
    query += ` WHERE id IN (
      SELECT DISTINCT item_id FROM maintenance 
      WHERE date <= date('now') AND (
        SELECT COUNT(*) FROM maintenance m2 
        WHERE m2.item_id = maintenance.item_id AND m2.date > date('now')
      ) > 0
    )`;
  }

  // Adicionar limite
  if (options?.maxRecords) {
    query += ` LIMIT ${options.maxRecords}`;
  }

  const result = await db.prepare(query).all();
  return (result.results as unknown as Item[]) || [];
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
 */
export async function createItem(
  db: D1Database,
  item: ItemInput
): Promise<Item> {
  const result = await db
    .prepare(
      'INSERT INTO items (name, description, price, quantity) VALUES (?, ?, ?, ?) RETURNING *'
    )
    .bind(item.name, item.description || null, item.price, item.quantity)
    .first();
  return result as unknown as Item;
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
 */
export async function createReservation(
  db: D1Database,
  reservation: ReservationInput
): Promise<Reservation> {
  const status = reservation.status || 'pending';
  const result = await db
    .prepare(
      'INSERT INTO reservations (item_id, customer_name, customer_email, date_from, date_to, status) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
    )
    .bind(
      reservation.item_id,
      reservation.customer_name,
      reservation.customer_email || null,
      reservation.date_from,
      reservation.date_to,
      status
    )
    .first();
  return result as unknown as Reservation;
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
