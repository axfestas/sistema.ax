-- Schema para D1 Database
-- Este é o schema completo e autoritativo.
-- Para bancos existentes, use os arquivos em migrations/ para aplicar as mudanças incrementais.

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  image_url TEXT,
  category TEXT,
  show_in_catalog INTEGER DEFAULT 1
);

CREATE TABLE reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_id TEXT UNIQUE,
  reservation_type TEXT NOT NULL DEFAULT 'unit', -- 'kit' or 'unit'
  item_id INTEGER,
  kit_id INTEGER,
  sweet_id INTEGER,
  design_id INTEGER,
  theme_id INTEGER,
  client_id INTEGER,
  quantity INTEGER DEFAULT 1,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  total_amount REAL,
  payment_type TEXT,
  payment_receipt_url TEXT,
  contract_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (kit_id) REFERENCES kits(id)
);

CREATE TABLE maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_id TEXT UNIQUE,
  item_id INTEGER,
  description TEXT,
  date DATE NOT NULL,
  cost REAL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE financial_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'income' or 'expense'
  description TEXT,
  amount REAL NOT NULL,
  date DATE NOT NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'admin' ou 'user'
  active INTEGER DEFAULT 1,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE portfolio_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1, -- 1 for active, 0 for inactive
  image_size TEXT DEFAULT 'feed-square', -- 'feed-vertical', 'feed-square', 'story', 'profile'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row
  company_name TEXT NOT NULL DEFAULT 'Ax Festas',
  company_description TEXT DEFAULT 'Aluguel de itens para festas e eventos. Qualidade e excelência no atendimento.',
  phone TEXT DEFAULT '(00) 00000-0000',
  email TEXT DEFAULT 'contato@axfestas.com.br',
  address TEXT DEFAULT 'A definir',
  facebook_url TEXT,
  instagram_url TEXT,
  whatsapp_url TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Kits
CREATE TABLE kits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Kit (relação muitos-para-muitos)
CREATE TABLE kit_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kit_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE(kit_id, item_id)
);

-- Tabela para rastrear itens individuais de cada reserva
CREATE TABLE reservation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Tabela de tokens de recuperação de senha
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Clientes
CREATE TABLE clients (
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
CREATE TABLE sweets (
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
CREATE TABLE designs (
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

-- Tabela de Temas
CREATE TABLE themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  show_in_catalog INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabela de Categorias (gerenciamento centralizado de categorias por seção)
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  section TEXT NOT NULL,
  UNIQUE(name, section)
);

-- Tabela de Solicitações de Reserva (do Carrinho)
CREATE TABLE reservation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_id TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  message TEXT,
  items_json TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_items_show_in_catalog ON items(show_in_catalog);
CREATE INDEX idx_items_custom_id ON items(custom_id);
CREATE INDEX idx_kits_custom_id ON kits(custom_id);
CREATE INDEX idx_reservations_custom_id ON reservations(custom_id);
CREATE INDEX idx_maintenance_custom_id ON maintenance(custom_id);
CREATE INDEX idx_kit_items_kit_id ON kit_items(kit_id);
CREATE INDEX idx_kit_items_item_id ON kit_items(item_id);
CREATE INDEX idx_reservation_items_reservation_id ON reservation_items(reservation_id);
CREATE INDEX idx_reservation_items_item_id ON reservation_items(item_id);
CREATE INDEX idx_reservation_items_item_dates ON reservation_items(item_id, date_from, date_to);
CREATE INDEX idx_reservations_dates ON reservations(date_from, date_to);
CREATE INDEX idx_reservations_kit_id ON reservations(kit_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_sweets_catalog ON sweets(show_in_catalog, is_active);
CREATE INDEX idx_designs_catalog ON designs(show_in_catalog, is_active);
CREATE INDEX idx_themes_catalog ON themes(show_in_catalog, is_active);
CREATE INDEX idx_categories_section ON categories(section);
CREATE INDEX idx_reservation_requests_status ON reservation_requests(status);
CREATE INDEX idx_reservation_requests_created_at ON reservation_requests(created_at);
CREATE INDEX idx_reservation_requests_custom_id ON reservation_requests(custom_id);

-- Sample data: Add Kit Festa Completo to catalog
INSERT OR IGNORE INTO items (id, name, description, price, quantity) 
VALUES (1, 'Kit Festa Completo', 'Inclui mesas, cadeiras, toalhas e decoração', 350.00, 10);

-- Initialize site settings with default values
INSERT OR IGNORE INTO site_settings (id, company_name, company_description, phone, email, address) 
VALUES (1, 'Ax Festas', 'Aluguel de itens para festas e eventos. Qualidade e excelência no atendimento.', '(00) 00000-0000', 'contato@axfestas.com.br', 'A definir');

-- Add default admin user (alex.fraga@axfestas.com.br)
-- Default password: Ax7866Nb@
-- 
-- ⚠️ SECURITY WARNING:
-- Change this password immediately after first login!
-- This is a known default password included for setup convenience.
--
INSERT OR IGNORE INTO users (email, password_hash, name, role) 
VALUES ('alex.fraga@axfestas.com.br', 'b20c87122e7397ae12d9af93c6dacac9:125aa6d9b3ef0df48800ba7a0103c550b476afc38fa01ab012d6a6823bf06e82', 'Alex Fraga', 'admin');
