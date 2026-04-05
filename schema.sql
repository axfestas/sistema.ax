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
  show_in_catalog INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  is_promotion INTEGER DEFAULT 0,
  original_price REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  items_json TEXT,
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
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'purchase')), -- 'income', 'expense', or 'purchase'
  description TEXT,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
  receipt_url TEXT
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
  is_featured INTEGER DEFAULT 0,
  is_promotion INTEGER DEFAULT 0,
  original_price REAL,
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

-- Tabela de Orçamentos
CREATE TABLE quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  event_date TEXT,
  event_location TEXT,
  items_json TEXT NOT NULL DEFAULT '[]',
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','approved','rejected')),
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Tabela de Contratos
CREATE TABLE contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  quote_id INTEGER,
  event_date TEXT,
  event_location TEXT,
  pickup_date TEXT,
  return_date TEXT,
  items_json TEXT NOT NULL DEFAULT '[]',
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','signed','completed')),
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id)
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
  is_featured INTEGER DEFAULT 0,
  is_promotion INTEGER DEFAULT 0,
  original_price REAL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabela de Design/Decoração
CREATE TABLE designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  quantidade_cartela INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  show_in_catalog INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  is_promotion INTEGER DEFAULT 0,
  original_price REAL,
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
  is_featured INTEGER DEFAULT 0,
  is_promotion INTEGER DEFAULT 0,
  original_price REAL,
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
CREATE INDEX idx_items_featured ON items(is_featured);
CREATE INDEX idx_items_promotion ON items(is_promotion);
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
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Tabela de Avaliações
CREATE TABLE testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_testimonials_status ON testimonials(status);

-- Tabela de Artes Criadas (marketing / redes sociais)
CREATE TABLE IF NOT EXISTS artes_criadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  caption TEXT,
  image_url TEXT,
  suggested_date TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_artes_criadas_status ON artes_criadas(status);

-- Tabela de Controle de Publicações
CREATE TABLE IF NOT EXISTS publicacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  arte_id INTEGER REFERENCES artes_criadas(id) ON DELETE SET NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  publish_date TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_publicacoes_status ON publicacoes(status);
CREATE INDEX idx_publicacoes_date ON publicacoes(publish_date);

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

-- Tabela de Sugestões
CREATE TABLE IF NOT EXISTS suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);

-- Tabela de Combos (promoções automáticas no carrinho)
CREATE TABLE IF NOT EXISTS combos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('products', 'category', 'mixed')),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed_price', 'percentage', 'fixed_amount')),
  discount_value REAL NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Produtos específicos vinculados a um combo
CREATE TABLE IF NOT EXISTS combo_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  combo_id INTEGER NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('item', 'kit', 'sweet', 'design', 'theme')),
  product_id INTEGER NOT NULL,
  product_name TEXT,
  required_quantity INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE
);

-- Categorias vinculadas a um combo
CREATE TABLE IF NOT EXISTS combo_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  combo_id INTEGER NOT NULL,
  category_name TEXT NOT NULL,
  product_section TEXT NOT NULL DEFAULT 'items' CHECK (product_section IN ('items', 'sweets', 'designs', 'themes')),
  FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_combos_active ON combos(is_active);
CREATE INDEX IF NOT EXISTS idx_combos_priority ON combos(priority);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo_id ON combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_categories_combo_id ON combo_categories(combo_id);

-- Tabela de Analytics (mapa de acessos ao site)
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  session_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
