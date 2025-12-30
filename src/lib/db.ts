import { D1Database } from '@cloudflare/workers-types';

declare global {
  var DB: D1Database;
}

export const db = globalThis.DB;

// Funções para interagir com o banco
export async function getItems() {
  const result = await db.prepare('SELECT * FROM items').all();
  return result.results;
}

export async function addItem(name: string, description: string, price: number, quantity: number) {
  await db.prepare('INSERT INTO items (name, description, price, quantity) VALUES (?, ?, ?, ?)').bind(name, description, price, quantity).run();
}

// Adicionar mais funções conforme necessário para reservas, manutenção, financeiro