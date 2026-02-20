-- Migration: Add categories table for managing item/sweet/design/theme categories

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  section TEXT NOT NULL,
  UNIQUE(name, section)
);

CREATE INDEX IF NOT EXISTS idx_categories_section ON categories(section);
