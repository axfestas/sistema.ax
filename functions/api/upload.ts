/**
 * Cloudflare Pages Function para upload de arquivos para R2
 * 
 * Endpoints:
 * - POST /api/upload - Upload de arquivo para R2 storage
 * - DELETE /api/upload?key=path/to/file - Remove arquivo do R2
 * - GET /api/upload?key=path/to/file - Retorna URL público do arquivo
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { requireAdmin } from '../../src/lib/auth';

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

/**
 * Upload de arquivo para R2
 */
export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    // Verificar autenticação admin
    await requireAdmin(context.env.DB, context.request);

    const contentType = context.request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const formData = await context.request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';
    const imageType = (formData.get('imageType') as string) || 'general'; // 'item', 'portfolio', 'general'

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar tipo de arquivo (apenas imagens)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WEBP)' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Note: Image aspect ratio validation is done on the client side
    // The imageType parameter indicates what validation was performed

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    // Extrair extensão de forma segura
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    // Sanitizar apenas o nome base (sem extensão)
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_');
    const key = `${folder}/${timestamp}-${baseName}.${extension}`;

    // Upload para R2
    const arrayBuffer = await file.arrayBuffer();
    await context.env.STORAGE.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Retornar informações do arquivo
    return new Response(
      JSON.stringify({
        success: true,
        key: key,
        url: `/api/images/${key}`,
        filename: file.name,
        size: file.size,
        type: file.type,
        imageType: imageType,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Erro de autenticação
    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          message: message,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to upload file',
        message: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Obter arquivo do R2
 */
export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const object = await context.env.STORAGE.get(key);

    if (!object) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const headers = new Headers() as Headers;
    object.writeHttpMetadata(headers as any);
    headers.set('etag', object.httpEtag);
    // Cache for 1 year - files use timestamp in key for cache busting
    // Note: Keys include timestamp, so each upload creates a unique URL
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    return new Response(object.body as any, {
      headers,
    });
  } catch (error: unknown) {
    console.error('Error getting file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Failed to get file',
        message: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Deletar arquivo do R2
 */
export async function onRequestDelete(context: {
  request: Request;
  env: Env;
}) {
  try {
    // Verificar autenticação admin
    await requireAdmin(context.env.DB, context.request);

    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await context.env.STORAGE.delete(key);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error deleting file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Erro de autenticação
    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          message: message,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to delete file',
        message: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
