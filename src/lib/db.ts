import { D1Database } from '@cloudflare/workers-types';

// Note: D1 Database is only available in Cloudflare Workers/Pages Functions
// For static pages, you'll need to use API routes or Pages Functions

declare global {
  var DB: D1Database | undefined;
}

export const db = globalThis.DB;

// Funções para interagir com o banco
// These functions will only work in Cloudflare Pages Functions (API routes)
export async function getItems() {
  if (!db) {
    console.warn('Database not available in static export');
    return [];
  }
  const result = await db.prepare('SELECT * FROM items').all();
  return result.results;
}

export async function addItem(name: string, description: string, price: number, quantity: number) {
  if (!db) {
    console.warn('Database not available in static export');
    return;
  }
  await db.prepare('INSERT INTO items (name, description, price, quantity) VALUES (?, ?, ?, ?)').bind(name, description, price, quantity).run();
}

// Adicionar mais funções conforme necessário para reservas, manutenção, financeiro