-- Migration: Add themes table and theme_id to reservations

CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  show_in_catalog INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_themes_catalog ON themes(show_in_catalog, is_active);

ALTER TABLE reservations ADD COLUMN theme_id INTEGER REFERENCES themes(id);
