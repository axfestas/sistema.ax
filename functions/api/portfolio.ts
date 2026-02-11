/**
 * Cloudflare Pages Function para gerenciar imagens do portfólio
 * 
 * Endpoints:
 * - GET /api/portfolio - Lista todas as imagens do portfólio
 * - GET /api/portfolio?id=1 - Busca uma imagem específica
 * - POST /api/portfolio - Cria nova imagem
 * - PUT /api/portfolio?id=1 - Atualiza uma imagem
 * - DELETE /api/portfolio?id=1 - Deleta uma imagem
 */

import {
  getPortfolioImages,
  getPortfolioImageById,
  createPortfolioImage,
  updatePortfolioImage,
  deletePortfolioImage,
  type PortfolioImageInput,
  type PortfolioImage,
} from '../../src/lib/db';

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;

    const imageId = url.searchParams.get('id');

    if (imageId) {
      const image = await getPortfolioImageById(db, Number(imageId));

      if (!image) {
        return new Response(JSON.stringify({ error: 'Image not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(image), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    const maxRecords = url.searchParams.get('maxRecords');

    const images = await getPortfolioImages(db, {
      activeOnly: activeOnly ? true : undefined,
      maxRecords: maxRecords ? Number(maxRecords) : undefined,
    });

    return new Response(JSON.stringify(images), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching portfolio images:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch portfolio images',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const body = (await context.request.json()) as PortfolioImageInput;

    if (!body.title || !body.image_url) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: title, image_url',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newImage = await createPortfolioImage(db, body);

    return new Response(JSON.stringify(newImage), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating portfolio image:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create portfolio image',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestPut(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const imageId = url.searchParams.get('id');

    if (!imageId) {
      return new Response(
        JSON.stringify({ error: 'Missing image ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json()) as Partial<PortfolioImageInput>;
    const updatedImage = await updatePortfolioImage(db, Number(imageId), body);

    if (!updatedImage) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedImage), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating portfolio image:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update portfolio image',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestDelete(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const imageId = url.searchParams.get('id');

    if (!imageId) {
      return new Response(
        JSON.stringify({ error: 'Missing image ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await deletePortfolioImage(db, Number(imageId));

    if (!success) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Image deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting portfolio image:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete portfolio image',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
