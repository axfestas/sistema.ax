-- Migration 004: Sistema de Kits e Controle de Quantidade
-- Adiciona suporte para criar kits de itens e gerenciar quantidades em reservas

-- Tabela de Kits
CREATE TABLE IF NOT EXISTS kits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  is_active INTEGER DEFAULT 1, -- 1 for active, 0 for inactive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Kit (relação muitos-para-muitos)
CREATE TABLE IF NOT EXISTS kit_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kit_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1, -- Quantidade do item neste kit
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Tabela para rastrear itens individuais de cada reserva
CREATE TABLE IF NOT EXISTS reservation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1, -- Quantidade reservada deste item
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Adicionar campos à tabela de reservations
-- SQLite não suporta ALTER TABLE ADD COLUMN IF NOT EXISTS, então usamos uma abordagem segura

-- Adicionar kit_id (pode ser NULL se reserva for de item individual)
-- Primeiro verificamos se a coluna já existe tentando selecioná-la
SELECT CASE 
  WHEN COUNT(*) > 0 THEN 'Column kit_id already exists'
  ELSE 'Adding kit_id column'
END as result
FROM pragma_table_info('reservations')
WHERE name = 'kit_id';

-- Se não existir, adicionamos (nota: em produção, use ferramentas de migração adequadas)
-- Por enquanto, vamos adicionar sem verificação (causará erro se já existir, mas é seguro)
-- ALTER TABLE reservations ADD COLUMN kit_id INTEGER;
-- ALTER TABLE reservations ADD COLUMN quantity INTEGER DEFAULT 1;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_kit_items_kit_id ON kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_item_id ON kit_items(item_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_item_id ON reservation_items(item_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_dates ON reservation_items(date_from, date_to);

-- Dados de exemplo: Kit Festa Básico
INSERT OR IGNORE INTO kits (id, name, description, price, is_active) 
VALUES (1, 'Kit Festa Básica', 'Kit com itens essenciais para uma festa pequena', 299.00, 1);

-- Associar itens ao kit (assumindo que existem itens 1-5 no estoque)
-- Nota: Ajuste os IDs conforme seus itens reais
-- INSERT OR IGNORE INTO kit_items (kit_id, item_id, quantity) VALUES (1, 1, 1);
