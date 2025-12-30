import { R2Bucket } from '@cloudflare/workers-types';

declare global {
  var STORAGE: R2Bucket;
}

export const storage = globalThis.STORAGE;

// Função para upload de arquivo
export async function uploadFile(key: string, file: File) {
  await storage.put(key, file);
}

// Função para download
export async function getFile(key: string) {
  const object = await storage.get(key);
  return object;
}