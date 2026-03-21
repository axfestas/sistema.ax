/**
 * Cloudflare Pages Function para gerenciar avaliações (testimonials)
 *
 * Endpoints:
 * - GET  /api/testimonials               - Lista avaliações (aprovadas por padrão)
 * - GET  /api/testimonials?status=all    - Lista todas (requer autenticação)
 * - POST /api/testimonials               - Cria nova avaliação (público)
 * - PUT  /api/testimonials?id=N          - Aprova/rejeita avaliação (requer autenticação)
 * - DELETE /api/testimonials?id=N        - Deleta avaliação (requer autenticação)
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
  type TestimonialInput,
} from '../../src/lib/db';
import { getAuthenticatedUser } from '../../src/lib/auth';

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
    const statusParam = url.searchParams.get('status');

    // Only admins can view all/pending/rejected testimonials
    if (statusParam && statusParam !== 'approved') {
      const user = await getAuthenticatedUser(db, context.request);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validate allowed status values
      const allowedStatuses = ['all', 'pending', 'approved', 'rejected'];
      if (!allowedStatuses.includes(statusParam)) {
        return new Response(JSON.stringify({ error: 'Invalid status parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 'all' means no status filter
      const testimonials = statusParam === 'all'
        ? await getTestimonials(db)
        : await getTestimonials(db, { status: statusParam as 'pending' | 'approved' | 'rejected' });

      return new Response(JSON.stringify(testimonials), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Public: only approved
    const testimonials = await getTestimonials(db, { status: 'approved' });
    return new Response(JSON.stringify(testimonials), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching testimonials:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch testimonials', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const body = (await context.request.json()) as TestimonialInput;

    if (!body.name || !body.comment || !body.stars) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: name, stars, comment' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stars = Number(body.stars);
    if (isNaN(stars) || stars < 1 || stars > 5) {
      return new Response(
        JSON.stringify({ error: 'stars deve ser entre 1 e 5' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const testimonial = await createTestimonial(db, {
      name: body.name.trim(),
      stars,
      comment: body.comment.trim(),
    });

    return new Response(JSON.stringify(testimonial), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating testimonial:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create testimonial', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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

    const user = await getAuthenticatedUser(db, context.request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await context.request.json()) as { status: 'approved' | 'rejected' };
    if (body.status !== 'approved' && body.status !== 'rejected') {
      return new Response(
        JSON.stringify({ error: 'status deve ser "approved" ou "rejected"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await updateTestimonialStatus(db, Number(id), body.status);
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update testimonial', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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

    const user = await getAuthenticatedUser(db, context.request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await deleteTestimonial(db, Number(id));
    if (!success) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Testimonial deleted' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting testimonial:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete testimonial', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
