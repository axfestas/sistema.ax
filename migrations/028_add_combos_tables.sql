-- Migration 028: Add combos tables
-- Adds support for promotional combos (product combos, category combos, mixed combos)

-- Main combos table
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

-- Specific products linked to a combo
CREATE TABLE IF NOT EXISTS combo_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  combo_id INTEGER NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('item', 'kit', 'sweet', 'design', 'theme')),
  product_id INTEGER NOT NULL,
  product_name TEXT,
  required_quantity INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE
);

-- Categories linked to a combo
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
