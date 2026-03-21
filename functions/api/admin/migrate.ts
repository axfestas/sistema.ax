/**
 * POST /api/admin/migrate
 * Safely applies all pending DDL migrations to the D1 database.
 * Each statement is executed independently so that already-applied
 * statements (duplicate column, table already exists, etc.) are
 * caught and reported as "skipped" without aborting the rest.
 *
 * Requires admin authentication.
 */

import type { D1Database } from '@cloudflare/workers-types';
import { getAuthenticatedUser } from '../../../src/lib/auth';

interface Env {
  DB: D1Database;
}

// All DDL statements that must exist in production.
// Each entry has a description and the SQL to run.
// Using IF NOT EXISTS where supported; ALTER TABLE errors are caught per-statement.
const MIGRATIONS: { desc: string; sql: string }[] = [
  // 006 – customer_phone on reservations
  {
    desc: '006: reservations.customer_phone',
    sql: 'ALTER TABLE reservations ADD COLUMN customer_phone TEXT',
  },
  // 011 – client_id, sweet_id, design_id on reservations
  {
    desc: '011: reservations.client_id',
    sql: 'ALTER TABLE reservations ADD COLUMN client_id INTEGER REFERENCES clients(id)',
  },
  {
    desc: '011: reservations.sweet_id',
    sql: 'ALTER TABLE reservations ADD COLUMN sweet_id INTEGER REFERENCES sweets(id)',
  },
  {
    desc: '011: reservations.design_id',
    sql: 'ALTER TABLE reservations ADD COLUMN design_id INTEGER REFERENCES designs(id)',
  },
  // 014 – users.active
  {
    desc: '014: users.active',
    sql: 'ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1',
  },
  // 015 – themes table + theme_id on reservations
  {
    desc: '015: themes table',
    sql: `CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      category TEXT,
      is_active INTEGER DEFAULT 1,
      show_in_catalog INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`,
  },
  {
    desc: '015: idx_themes_catalog',
    sql: 'CREATE INDEX IF NOT EXISTS idx_themes_catalog ON themes(show_in_catalog, is_active)',
  },
  {
    desc: '015: reservations.theme_id',
    sql: 'ALTER TABLE reservations ADD COLUMN theme_id INTEGER REFERENCES themes(id)',
  },
  // 016 – categories table
  {
    desc: '016: categories table',
    sql: `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      UNIQUE(name, section)
    )`,
  },
  {
    desc: '016: idx_categories_section',
    sql: 'CREATE INDEX IF NOT EXISTS idx_categories_section ON categories(section)',
  },
  // 017 – payment fields on reservations
  {
    desc: '017: reservations.total_amount',
    sql: 'ALTER TABLE reservations ADD COLUMN total_amount REAL',
  },
  {
    desc: '017: reservations.payment_type',
    sql: 'ALTER TABLE reservations ADD COLUMN payment_type TEXT',
  },
  {
    desc: '017: reservations.payment_receipt_url',
    sql: 'ALTER TABLE reservations ADD COLUMN payment_receipt_url TEXT',
  },
  {
    desc: '017: reservations.contract_url',
    sql: 'ALTER TABLE reservations ADD COLUMN contract_url TEXT',
  },
  // 018 – drop price from themes (ignore if already gone)
  {
    desc: '018: themes DROP COLUMN price',
    sql: 'ALTER TABLE themes DROP COLUMN price',
  },
  // 019 – allow multiple items per reservation via JSON array
  {
    desc: '019: reservations.items_json',
    sql: 'ALTER TABLE reservations ADD COLUMN items_json TEXT',
  },
  // 020 – quantidade_cartela on designs
  {
    desc: '020: designs.quantidade_cartela',
    sql: 'ALTER TABLE designs ADD COLUMN quantidade_cartela INTEGER DEFAULT 0',
  },
  // 021 – artes_criadas table (marketing content)
  {
    desc: '021: artes_criadas table',
    sql: `CREATE TABLE IF NOT EXISTS artes_criadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      caption TEXT,
      image_url TEXT,
      suggested_date TEXT,
      status TEXT NOT NULL DEFAULT 'rascunho',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`,
  },
  {
    desc: '021: idx_artes_criadas_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_artes_criadas_status ON artes_criadas(status)`,
  },
  // 022 – publicacoes table (social media publications)
  {
    desc: '022: publicacoes table',
    sql: `CREATE TABLE IF NOT EXISTS publicacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arte_id INTEGER REFERENCES artes_criadas(id) ON DELETE SET NULL,
      platform TEXT NOT NULL DEFAULT 'instagram',
      publish_date TEXT,
      status TEXT NOT NULL DEFAULT 'agendado',
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`,
  },
  {
    desc: '022: idx_publicacoes_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_publicacoes_status ON publicacoes(status)`,
  },
  {
    desc: '022: idx_publicacoes_date',
    sql: `CREATE INDEX IF NOT EXISTS idx_publicacoes_date ON publicacoes(publish_date)`,
  },
  // 023 – reservation_requests table (cart-based reservation requests)
  {
    desc: '023: reservation_requests table',
    sql: `CREATE TABLE IF NOT EXISTS reservation_requests (
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
    )`,
  },
  {
    desc: '023: idx_reservation_requests_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_reservation_requests_status ON reservation_requests(status)`,
  },
  {
    desc: '023: idx_reservation_requests_created_at',
    sql: `CREATE INDEX IF NOT EXISTS idx_reservation_requests_created_at ON reservation_requests(created_at)`,
  },
  {
    desc: '023: idx_reservation_requests_custom_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_reservation_requests_custom_id ON reservation_requests(custom_id)`,
  },
  // 024 – designs.quantity (stock quantity field)
  {
    desc: '024: designs.quantity',
    sql: `ALTER TABLE designs ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0`,
  },
  // 025 – enhance financial_records (category, payment_method, status, receipt_url)
  {
    desc: '025: financial_records.category',
    sql: `ALTER TABLE financial_records ADD COLUMN category TEXT`,
  },
  {
    desc: '025: financial_records.payment_method',
    sql: `ALTER TABLE financial_records ADD COLUMN payment_method TEXT`,
  },
  {
    desc: '025: financial_records.status',
    sql: `ALTER TABLE financial_records ADD COLUMN status TEXT DEFAULT 'paid'`,
  },
  {
    desc: '025: financial_records.receipt_url',
    sql: `ALTER TABLE financial_records ADD COLUMN receipt_url TEXT`,
  },
  // 026 – quotes table (orçamentos)
  {
    desc: '026: quotes table',
    sql: `CREATE TABLE IF NOT EXISTS quotes (
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
    )`,
  },
  {
    desc: '026: idx_quotes_client_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id)`,
  },
  {
    desc: '026: idx_quotes_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)`,
  },
  // 027 – contracts table (contratos)
  {
    desc: '027: contracts table',
    sql: `CREATE TABLE IF NOT EXISTS contracts (
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
    )`,
  },
  {
    desc: '027: idx_contracts_client_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id)`,
  },
  {
    desc: '027: idx_contracts_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)`,
  },
  // 028 – catalog feature flags on all catalog entities
  {
    desc: '028: items.is_featured',
    sql: `ALTER TABLE items ADD COLUMN is_featured INTEGER DEFAULT 0`,
  },
  {
    desc: '028: items.is_promotion',
    sql: `ALTER TABLE items ADD COLUMN is_promotion INTEGER DEFAULT 0`,
  },
  {
    desc: '028: items.original_price',
    sql: `ALTER TABLE items ADD COLUMN original_price REAL`,
  },
  {
    desc: '028: kits.is_featured',
    sql: `ALTER TABLE kits ADD COLUMN is_featured INTEGER DEFAULT 0`,
  },
  {
    desc: '028: kits.is_promotion',
    sql: `ALTER TABLE kits ADD COLUMN is_promotion INTEGER DEFAULT 0`,
  },
  {
    desc: '028: kits.original_price',
    sql: `ALTER TABLE kits ADD COLUMN original_price REAL`,
  },
  {
    desc: '028: sweets.is_featured',
    sql: `ALTER TABLE sweets ADD COLUMN is_featured INTEGER DEFAULT 0`,
  },
  {
    desc: '028: sweets.is_promotion',
    sql: `ALTER TABLE sweets ADD COLUMN is_promotion INTEGER DEFAULT 0`,
  },
  {
    desc: '028: sweets.original_price',
    sql: `ALTER TABLE sweets ADD COLUMN original_price REAL`,
  },
  {
    desc: '028: designs.is_featured',
    sql: `ALTER TABLE designs ADD COLUMN is_featured INTEGER DEFAULT 0`,
  },
  {
    desc: '028: designs.is_promotion',
    sql: `ALTER TABLE designs ADD COLUMN is_promotion INTEGER DEFAULT 0`,
  },
  {
    desc: '028: designs.original_price',
    sql: `ALTER TABLE designs ADD COLUMN original_price REAL`,
  },
  {
    desc: '028: themes.is_featured',
    sql: `ALTER TABLE themes ADD COLUMN is_featured INTEGER DEFAULT 0`,
  },
  {
    desc: '028: themes.is_promotion',
    sql: `ALTER TABLE themes ADD COLUMN is_promotion INTEGER DEFAULT 0`,
  },
  {
    desc: '028: themes.original_price',
    sql: `ALTER TABLE themes ADD COLUMN original_price REAL`,
  },
  // 029 – testimonials table
  {
    desc: '029: testimonials table',
    sql: `CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
      comment TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    desc: '029: idx_testimonials_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status)`,
  },
];

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  // Require admin authentication
  try {
    const user = await getAuthenticatedUser(db, context.request);
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: { desc: string; status: 'applied' | 'skipped' | 'error'; detail?: string }[] = [];

  for (const migration of MIGRATIONS) {
    try {
      await db.prepare(migration.sql).run();
      results.push({ desc: migration.desc, status: 'applied' });
    } catch (err: any) {
      const msg: string = err?.message || String(err);
      // "duplicate column name" → ADD COLUMN already applied
      // "already exists"       → CREATE TABLE/INDEX already applied
      // "no such column"       → DROP COLUMN already applied (column gone)
      const isAlreadyApplied =
        msg.includes('duplicate column') ||
        msg.includes('already exists') ||
        msg.includes('no such column');
      results.push({
        desc: migration.desc,
        status: isAlreadyApplied ? 'skipped' : 'error',
        detail: msg,
      });
    }
  }

  const hasErrors = results.some((r) => r.status === 'error');
  return new Response(JSON.stringify({ results }), {
    status: hasErrors ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
