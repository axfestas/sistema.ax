-- Migration 026: Add missing tables and columns
-- Fixes schema gaps not covered by previous migrations:
--   1. reservations.items_json column (from migration 019 which only runs on existing DBs)
--   2. financial_records columns: category, payment_method, status, receipt_url (migration 022)
--   3. quotes table (migration 023)
--   4. contracts table (migration 023)

-- 1. Add items_json to reservations (safe if column already exists - will be ignored on error)
ALTER TABLE reservations ADD COLUMN items_json TEXT;

-- 2. Add missing columns to financial_records
ALTER TABLE financial_records ADD COLUMN category TEXT;
ALTER TABLE financial_records ADD COLUMN payment_method TEXT;
ALTER TABLE financial_records ADD COLUMN status TEXT DEFAULT 'paid';
ALTER TABLE financial_records ADD COLUMN receipt_url TEXT;

-- 3. Quotes table
CREATE TABLE IF NOT EXISTS quotes (
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

-- 4. Contracts table
CREATE TABLE IF NOT EXISTS contracts (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
