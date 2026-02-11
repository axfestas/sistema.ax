-- Schema para D1 Database

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL
);

CREATE TABLE reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
