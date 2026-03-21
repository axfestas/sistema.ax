-- Migration 025: Add artes_criadas and publicacoes tables for marketing management

CREATE TABLE IF NOT EXISTS artes_criadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  caption TEXT,
  image_url TEXT,
  suggested_date TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_artes_criadas_status ON artes_criadas(status);

CREATE TABLE IF NOT EXISTS publicacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  arte_id INTEGER REFERENCES artes_criadas(id) ON DELETE SET NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  publish_date TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_publicacoes_status ON publicacoes(status);
CREATE INDEX IF NOT EXISTS idx_publicacoes_date ON publicacoes(publish_date);
