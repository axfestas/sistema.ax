/**
 * Cloudflare Pages Function to serve images from R2
 * 
 * Endpoint:
 * GET /api/images/folder/filename.ext - Serve image from R2 storage
 * 
 * This is a public endpoint optimized for serving images with caching.
 */

import type { R2Bucket } from '@cloudflare/workers-types';

interface Env {
  STORAGE: R2Bucket;
}

/**
 * Serve image file from R2
 * Path pattern: /api/images/folder/timestamp-filename.ext
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { path?: string };
}) {
  try {
    // Extract the full image path from parameters
    const key = context.params.path || '';
    
    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Image path required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch object from R2
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

    // Configure headers for the image
    const headers = new Headers();
    (object.writeHttpMetadata as any)(headers);
    headers.set('etag', object.httpEtag);
    
    // Aggressive caching - files have timestamp in name for cache busting
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    
    // CORS headers to allow usage from other origins
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
