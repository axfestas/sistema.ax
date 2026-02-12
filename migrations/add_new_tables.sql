-- =====================================================
-- MIGRATION: Add New Tables for Complete System
-- Date: 2026-02-12
-- Description: Adds clients, sweets, designs, and reservation_items tables
-- =====================================================

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cpf TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabela de Doces
CREATE TABLE IF NOT EXISTS sweets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  show_in_catalog INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabela de Design/Decoração
CREATE TABLE IF NOT EXISTS designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  show_in_catalog INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabela de Itens da Reserva (relacionamento muitos-para-muitos)
CREATE TABLE IF NOT EXISTS reservation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  item_type TEXT NOT NULL, -- 'item', 'kit', 'sweet', 'design'
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_sweets_catalog ON sweets(show_in_catalog, is_active);
CREATE INDEX IF NOT EXISTS idx_designs_catalog ON designs(show_in_catalog, is_active);

-- =====================================================
-- Note: You may need to alter the existing reservations table
-- to add client_id if it doesn't exist already.
-- 
-- To check the current structure:
-- PRAGMA table_info(reservations);
--
-- If client_id doesn't exist, add it with:
-- ALTER TABLE reservations ADD COLUMN client_id INTEGER;
-- ALTER TABLE reservations ADD FOREIGN KEY (client_id) REFERENCES clients(id);
-- =====================================================
