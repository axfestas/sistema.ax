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
