/**
 * Shared type definitions for Cloudflare Pages Functions
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

/**
 * Environment bindings available in Pages Functions
 */
export interface Env {
  /** D1 Database binding for SQL operations */
  DB: D1Database;
  /** R2 Storage binding for file operations (optional for backward compatibility) */
  STORAGE?: R2Bucket;
}

/**
 * Context object passed to Pages Functions
 */
export interface PagesContext {
  request: Request;
  env: Env;
  params?: Record<string, string>;
  waitUntil?: (promise: Promise<unknown>) => void;
  passThroughOnException?: () => void;
}
