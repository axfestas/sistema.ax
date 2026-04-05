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
  // 030 – hero_image_url on site_settings
  {
    desc: '030: site_settings.hero_image_url',
    sql: `ALTER TABLE site_settings ADD COLUMN hero_image_url TEXT`,
  },
  // 031 – suggestions table
  {
    desc: '031: suggestions table',
    sql: `CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'archived')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    desc: '031: idx_suggestions_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status)`,
  },
  // 032 – combos tables
  {
    desc: '032: combos table',
    sql: `CREATE TABLE IF NOT EXISTS combos (
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
    )`,
  },
  {
    desc: '032: combo_items table',
    sql: `CREATE TABLE IF NOT EXISTS combo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      combo_id INTEGER NOT NULL,
      product_type TEXT NOT NULL CHECK (product_type IN ('item', 'kit', 'sweet', 'design', 'theme')),
      product_id INTEGER NOT NULL,
      product_name TEXT,
      required_quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE
    )`,
  },
  {
    desc: '032: combo_categories table',
    sql: `CREATE TABLE IF NOT EXISTS combo_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      combo_id INTEGER NOT NULL,
      category_name TEXT NOT NULL,
      product_section TEXT NOT NULL DEFAULT 'items' CHECK (product_section IN ('items', 'sweets', 'designs', 'themes')),
      FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE
    )`,
  },
  {
    desc: '032: idx_combos_active',
    sql: `CREATE INDEX IF NOT EXISTS idx_combos_active ON combos(is_active)`,
  },
  {
    desc: '032: idx_combos_priority',
    sql: `CREATE INDEX IF NOT EXISTS idx_combos_priority ON combos(priority)`,
  },
  {
    desc: '032: idx_combo_items_combo_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_combo_items_combo_id ON combo_items(combo_id)`,
  },
  {
    desc: '032: idx_combo_categories_combo_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_combo_categories_combo_id ON combo_categories(combo_id)`,
  },
  // 033 – contract_clauses table
  {
    desc: '033: contract_clauses table',
    sql: `CREATE TABLE IF NOT EXISTS contract_clauses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_num INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    desc: '033: idx_contract_clauses_order',
    sql: `CREATE INDEX IF NOT EXISTS idx_contract_clauses_order ON contract_clauses(order_num)`,
  },
  {
    desc: '033: idx_contract_clauses_active',
    sql: `CREATE INDEX IF NOT EXISTS idx_contract_clauses_active ON contract_clauses(is_active)`,
  },
  // 033-seed – default contract clauses (INSERT OR IGNORE to avoid duplicates)
  {
    desc: '033-seed: cláusula 1 - Do Objeto da Locação',
    sql: `INSERT OR IGNORE INTO contract_clauses (id, order_num, title, content) VALUES (1, 1, '01. Do Objeto da Locação', 'A locadora Ax Festas disponibiliza a locação de mobiliário e objetos destinados à realização de festas e eventos em geral. Os itens especificados no pedido abaixo fazem parte deste contrato e foram solicitados no momento da contratação.')`,
  },
  {
    desc: '033-seed: cláusula 2 - Das Retiradas e Devoluções',
    sql: `INSERT OR IGNORE INTO contract_clauses (id, order_num, title, content) VALUES (2, 2, '02. Das Retiradas e Devoluções', '2.1. As retiradas e devoluções dos itens locados deverão ser realizadas com 24 (vinte e quatro) horas de antecedência ou na data do evento, no endereço Rua Jacintha de Paulo Ferreira, nº 12, Bairro André Carloni, Serra/ES, CEP: 29161-820.
2.2. Todo o material locado deve ser devolvido no mesmo local em que foram retirados.
2.3. Os itens locados serão entregues limpos e sem avarias, devidamente embalados.
2.4. No ato da recepção e devolução, os bens locados deverão ser conferidos pelo Locatário(a/e) e Locador(a/e).
2.5. Em caso de necessidade de reposição ou danos nos itens locados, será de responsabilidade do Locatário(a/e).')`,
  },
  {
    desc: '033-seed: cláusula 3 - Do Preço e Pagamento',
    sql: `INSERT OR IGNORE INTO contract_clauses (id, order_num, title, content) VALUES (3, 3, '03. Do Preço e Pagamento', '3.1. O Locatário(a/e) pagará pelo valor descrito no pedido acima.
3.2. Para garantir a reserva dos itens locados, aceitamos o parcelamento do valor da locação da seguinte forma: Pagamento de 50% (cinquenta por cento) do valor como sinal, realizado por meio de Pix, cartão de crédito ou cartão de débito e os outros 50% (cinquenta por cento) deverá ser quitado no momento da retirada dos itens locados. Caso o cliente prefira, poderá optar pelo pagamento integral (100%) no ato da reserva.
3.3. Os pagamentos feitos via cartão estão sujeitos a taxa conforme o banco PagBank. Cartão de crédito com taxa de 3,14% e cartão de débito com taxa de 0,88%.
3.4. A locação para a data contratada só será garantida mediante o pagamento de 100% do valor do pedido.
3.5. Em caso de cancelamento, será restituído o equivalente a 80% (oitenta por cento) do valor total da locação, a título de reembolso.
3.6. Não serão aceitos pagamentos após o evento ou na devolução de itens locados.')`,
  },
  {
    desc: '033-seed: cláusula 4 - Das Avarias de Itens Locados',
    sql: `INSERT OR IGNORE INTO contract_clauses (id, order_num, title, content) VALUES (4, 4, '04. Das Avarias de Itens Locados', '4.1. O Locador(a/e) se compromete a entregar o produto em bom estado de conservação (salvo desgaste natural da utilização), e o Locatário(a/e), no ato da retirada, confirma e presume o bom estado de conservação.
4.2. No ato da devolução dos bens locados, estes deverão estar no mesmo estado da retirada (sem furos, traços de colagem, cola ou adesivos, marcas de grampeador ou grampos, trincos, arranhões, manchas, quebrados ou peças faltantes), tais como foram recebidos, respondendo o Locatário(a/e) pelos danos causados.
4.3. Após emissão do contrato, a solicitação da troca e/ou exclusão de itens poderá ocorrer no máximo dois dias antes da data do aluguel.')`,
  },
  {
    desc: '033-seed: cláusula 5 - Das Multas Contratuais',
    sql: `INSERT OR IGNORE INTO contract_clauses (id, order_num, title, content) VALUES (5, 5, '05. Das Multas Contratuais', '5.1. No caso de peças com avarias, será cobrado o valor de reposição; em caso de indisponibilidade, será cobrado o valor de mercado.
5.2. No caso de não devolução de peças individuais ou partes, serão cobrados o valor de reposição; em caso de indisponibilidade, será cobrado o valor de mercado.
5.3. No caso de não devolução de itens locados dentro do prazo contratado, será cobrado 1% (um por cento) do valor do contrato por dia de atraso.
5.4. A reforma em itens avariados e/ou compra para reposição de itens advindos dos casos acima citados é exclusiva da Ax Festas, cabendo ao Locatário(a/e) efetuar os devidos pagamentos ora descritos.')`,
  },
  {
    desc: '033-seed: cláusula 6 - Disposições Gerais',
    sql: `INSERT OR IGNORE INTO contract_clauses (id, order_num, title, content) VALUES (6, 6, '06. Disposições Gerais', '06.1. As partes declaram estar de acordo com todas as cláusulas deste contrato, comprometendo-se a cumpri-las integralmente.')`,
  },
  // 034 – locador fields on site_settings
  {
    desc: '034: site_settings.locador_name',
    sql: `ALTER TABLE site_settings ADD COLUMN locador_name TEXT DEFAULT 'ALEX DOS SANTOS FRAGA'`,
  },
  {
    desc: '034: site_settings.locador_cpf',
    sql: `ALTER TABLE site_settings ADD COLUMN locador_cpf TEXT DEFAULT '142.612.667-09'`,
  },
  {
    desc: '034: site_settings.locador_address',
    sql: `ALTER TABLE site_settings ADD COLUMN locador_address TEXT DEFAULT 'Rua Jacintha de Paulo Ferreira, nº 12, Bairro André Carloni, Serra/ES, CEP: 29161-820'`,
  },
  // 035 – client_name and client_phone on quotes (allows quotes without a registered client)
  {
    desc: '035: quotes.client_name',
    sql: `ALTER TABLE quotes ADD COLUMN client_name TEXT`,
  },
  {
    desc: '035: quotes.client_phone',
    sql: `ALTER TABLE quotes ADD COLUMN client_phone TEXT`,
  },
  {
    desc: '035: backfill quotes client_name and client_phone from clients table',
    sql: `UPDATE quotes SET client_name = (SELECT name FROM clients WHERE clients.id = quotes.client_id), client_phone = (SELECT phone FROM clients WHERE clients.id = quotes.client_id) WHERE client_id IS NOT NULL`,
  },
  // 036 – caption on publicacoes
  {
    desc: '036: publicacoes.caption',
    sql: `ALTER TABLE publicacoes ADD COLUMN caption TEXT`,
  },
  // 037 – make quotes.client_id nullable (was NOT NULL, preventing freeform quotes)
  {
    desc: '037a: quotes - rename to quotes_v1 (prepare nullable client_id)',
    sql: `ALTER TABLE quotes RENAME TO quotes_v1`,
  },
  {
    desc: '037b: quotes - recreate table with nullable client_id',
    sql: `CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      client_name TEXT,
      client_phone TEXT,
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
    desc: '037c: quotes - copy data from quotes_v1',
    sql: `INSERT INTO quotes (id, client_id, client_name, client_phone, event_date, event_location, items_json, discount, total, status, notes, created_at) SELECT id, client_id, client_name, client_phone, event_date, event_location, items_json, discount, total, status, notes, created_at FROM quotes_v1`,
  },
  // 037d – contracts has a FK to quotes (which was renamed to quotes_v1 in 037a by SQLite's
  // auto-update of FK references). We must drop contracts first, then drop quotes_v1, then
  // recreate contracts pointing at the new quotes table and restore its data.
  {
    desc: '037d: contracts - backup before quotes_v1 drop',
    sql: `CREATE TABLE IF NOT EXISTS contracts_bak AS SELECT * FROM contracts`,
  },
  {
    desc: '037d2: contracts - drop to remove FK dependency on quotes_v1',
    sql: `DROP TABLE IF EXISTS contracts`,
  },
  {
    desc: '037d3: quotes - drop old table quotes_v1',
    sql: `DROP TABLE IF EXISTS quotes_v1`,
  },
  {
    desc: '037d4: contracts - recreate with FK to new quotes',
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
    desc: '037d5: contracts - restore data from backup',
    sql: `INSERT OR IGNORE INTO contracts SELECT * FROM contracts_bak`,
  },
  {
    desc: '037d6: contracts - drop backup table',
    sql: `DROP TABLE IF EXISTS contracts_bak`,
  },
  {
    desc: '037d7: contracts - recreate idx_contracts_client_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id)`,
  },
  {
    desc: '037d8: contracts - recreate idx_contracts_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)`,
  },
  {
    desc: '037e: quotes - recreate idx_quotes_client_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id)`,
  },
  {
    desc: '037f: quotes - recreate idx_quotes_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)`,
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
      // "no such table"        → RENAME/DROP already applied (table gone/renamed)
      const isAlreadyApplied =
        msg.includes('duplicate column') ||
        msg.includes('already exists') ||
        msg.includes('no such column') ||
        msg.includes('no such table');
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
