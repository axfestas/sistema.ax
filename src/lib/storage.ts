import { R2Bucket } from '@cloudflare/workers-types';

// Note: R2 Storage is only available in Cloudflare Workers/Pages Functions
// For static pages, you'll need to use API routes or Pages Functions

declare global {
  var STORAGE: R2Bucket | undefined;
}

export const storage = globalThis.STORAGE;

// Função para upload de arquivo
// These functions will only work in Cloudflare Pages Functions (API routes)
export async function uploadFile(key: string, file: Blob | ArrayBuffer | string) {
  if (!storage) {
    console.warn('Storage not available in static export');
    return;
  }
  // Type assertion needed due to incompatibility between browser and Cloudflare Blob types
  await storage.put(key, file as unknown as ArrayBuffer);
}

// Função para download
export async function getFile(key: string) {
  if (!storage) {
    console.warn('Storage not available in static export');
    return null;
  }
  const object = await storage.get(key);
  return object;
}