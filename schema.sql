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
