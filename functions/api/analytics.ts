/**
 * Cloudflare Pages Function para analytics de acessos do site
 *
 * Endpoints:
 * - POST /api/analytics          — Registra uma visita (público, sem auth)
 * - GET  /api/analytics?type=overview   — Totais gerais (admin)
 * - GET  /api/analytics?type=daily&days=30 — Visitas por dia (admin)
 * - GET  /api/analytics?type=sessions   — Estatísticas de sessões (admin)
 * - GET  /api/analytics?type=products   — Visitas a páginas de produto (admin)
 */

import type { D1Database } from '@cloudflare/workers-types';
import { requireAdmin } from '../../src/lib/auth';

interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// ─── POST — Record a page view ─────────────────────────────────────────────

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const body = (await context.request.json()) as {
      path?: string;
      referrer?: string;
      session_id?: string;
    };

    const path = (body.path ?? '').trim().slice(0, 500);
    if (!path) {
      return new Response(JSON.stringify({ error: 'path is required' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Skip recording admin panel visits
    if (path.startsWith('/admin')) {
      return new Response(JSON.stringify({ ok: true }), { headers: CORS_HEADERS });
    }

    const referrer = (body.referrer ?? '').trim().slice(0, 500) || null;
    const session_id = (body.session_id ?? '').trim().slice(0, 64) || null;

    await db
      .prepare('INSERT INTO page_views (path, referrer, session_id) VALUES (?, ?, ?)')
      .bind(path, referrer, session_id)
      .run();

    return new Response(JSON.stringify({ ok: true }), { headers: CORS_HEADERS });
  } catch (error: any) {
    // Silently fail for tracking — never break the user's experience
    console.error('[analytics] POST error:', error?.message);
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  }
}

// ─── GET — Query analytics (admin only) ───────────────────────────────────

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const adminCheck = await requireAdmin(context.request, context.env.DB);
    if (adminCheck) return adminCheck;

    const db = context.env.DB;
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') ?? 'overview';
    const days = Math.min(Math.max(Number(url.searchParams.get('days') ?? '30'), 1), 365);

    if (type === 'overview') {
      const since = Math.floor(Date.now() / 1000) - days * 86400;

      const [total, period, uniqueSessions, topPages] = await Promise.all([
        db.prepare('SELECT COUNT(*) as count FROM page_views').first<{ count: number }>(),
        db
          .prepare('SELECT COUNT(*) as count FROM page_views WHERE created_at >= ?')
          .bind(since)
          .first<{ count: number }>(),
        db
          .prepare(
            'SELECT COUNT(DISTINCT session_id) as count FROM page_views WHERE session_id IS NOT NULL AND created_at >= ?'
          )
          .bind(since)
          .first<{ count: number }>(),
        db
          .prepare(
            `SELECT path, COUNT(*) as views
             FROM page_views
             WHERE created_at >= ?
             GROUP BY path
             ORDER BY views DESC
             LIMIT 10`
          )
          .bind(since)
          .all<{ path: string; views: number }>(),
      ]);

      return new Response(
        JSON.stringify({
          total: total?.count ?? 0,
          period: period?.count ?? 0,
          unique_sessions: uniqueSessions?.count ?? 0,
          top_pages: topPages.results ?? [],
          days,
        }),
        { headers: CORS_HEADERS }
      );
    }

    if (type === 'daily') {
      const since = Math.floor(Date.now() / 1000) - days * 86400;
      const result = await db
        .prepare(
          `SELECT
             date(created_at, 'unixepoch') as day,
             COUNT(*) as views,
             COUNT(DISTINCT session_id) as sessions
           FROM page_views
           WHERE created_at >= ?
           GROUP BY day
           ORDER BY day ASC`
        )
        .bind(since)
        .all<{ day: string; views: number; sessions: number }>();

      return new Response(JSON.stringify(result.results ?? []), { headers: CORS_HEADERS });
    }

    if (type === 'sessions') {
      const since = Math.floor(Date.now() / 1000) - days * 86400;
      const [totalViews, uniqueSessions, avgPerSession, byHour] = await Promise.all([
        db
          .prepare('SELECT COUNT(*) as count FROM page_views WHERE created_at >= ?')
          .bind(since)
          .first<{ count: number }>(),
        db
          .prepare(
            'SELECT COUNT(DISTINCT session_id) as count FROM page_views WHERE session_id IS NOT NULL AND created_at >= ?'
          )
          .bind(since)
          .first<{ count: number }>(),
        db
          .prepare(
            `SELECT AVG(pages_per_session) as avg FROM (
               SELECT COUNT(*) as pages_per_session
               FROM page_views
               WHERE session_id IS NOT NULL AND created_at >= ?
               GROUP BY session_id
             )`
          )
          .bind(since)
          .first<{ avg: number }>(),
        db
          .prepare(
            `SELECT
               CAST(strftime('%H', datetime(created_at, 'unixepoch')) AS INTEGER) as hour,
               COUNT(*) as views
             FROM page_views
             WHERE created_at >= ?
             GROUP BY hour
             ORDER BY hour ASC`
          )
          .bind(since)
          .all<{ hour: number; views: number }>(),
      ]);

      return new Response(
        JSON.stringify({
          total_views: totalViews?.count ?? 0,
          unique_sessions: uniqueSessions?.count ?? 0,
          avg_pages_per_session: Math.round((avgPerSession?.avg ?? 0) * 10) / 10,
          by_hour: byHour.results ?? [],
          days,
        }),
        { headers: CORS_HEADERS }
      );
    }

    if (type === 'products') {
      const since = Math.floor(Date.now() / 1000) - days * 86400;
      const result = await db
        .prepare(
          `SELECT
             path,
             COUNT(*) as views,
             COUNT(DISTINCT session_id) as sessions
           FROM page_views
           WHERE path LIKE '/produto%' AND created_at >= ?
           GROUP BY path
           ORDER BY views DESC
           LIMIT 50`
        )
        .bind(since)
        .all<{ path: string; views: number; sessions: number }>();

      return new Response(JSON.stringify(result.results ?? []), { headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  } catch (error: any) {
    console.error('[analytics] GET error:', error?.message);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics', message: error?.message }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
