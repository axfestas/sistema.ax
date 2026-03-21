-- Migration 023: Add quotes (orçamentos) and contracts (contratos) tables

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
