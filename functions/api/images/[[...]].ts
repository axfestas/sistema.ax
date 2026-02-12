/**
 * Cloudflare Pages Function para servir imagens do R2
 * 
 * Endpoint:
 * GET /api/images/folder/filename.ext - Serve imagem do R2 storage
 * 
 * Este é um endpoint público otimizado para servir imagens com cache.
 */

import type { R2Bucket } from '@cloudflare/workers-types';

interface Env {
  STORAGE: R2Bucket;
}

/**
 * Serve arquivo de imagem do R2
 * Path pattern: /api/images/folder/timestamp-filename.ext
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { path: string[] };
}) {
  try {
    // Extrair o caminho completo da imagem dos parâmetros
    const pathParts = context.params.path || [];
    
    if (pathParts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Image path required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Reconstruir o key completo (folder/filename)
    const key = pathParts.join('/');

    // Buscar objeto do R2
    const object = await context.env.STORAGE.get(key);

    if (!object) {
      return new Response(
        JSON.stringify({ error: 'Image not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Configurar headers para a imagem
    const headers = new Headers() as Headers;
    object.writeHttpMetadata(headers as any);
    headers.set('etag', object.httpEtag);
    
    // Cache agressivo - arquivos têm timestamp no nome para cache busting
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    
    // CORS headers para permitir uso em outras origens
    headers.set('access-control-allow-origin', '*');
    headers.set('access-control-allow-methods', 'GET, HEAD, OPTIONS');

    return new Response(object.body as any, {
      headers,
    });
  } catch (error: unknown) {
    console.error('Error serving image:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: 'Failed to serve image',
        message: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
