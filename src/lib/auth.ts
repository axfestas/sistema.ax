/**
 * Autenticação com Email + Senha (D1)
 * Funções para hash, verificação e gerenciamento de sessões
 */

import { createHash, randomBytes } from 'crypto';

// ==================== TIPOS ====================

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface AuthSession {
  id: string;
  user_id: number;
  expires_at: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

// ==================== FUNÇÕES DE HASH ====================

/**
 * Gera um hash SHA256 da senha com salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  if (!salt) {
    salt = randomBytes(16).toString('hex');
  }

  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');

  return { hash, salt };
}

/**
 * Verifica se a senha está correta
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: newHash } = hashPassword(password, salt);
  return newHash === hash;
}

// ==================== GERENCIAMENTO DE USUÁRIOS ====================

/**
 * Busca usuário por email
 */
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT id, email, name, role, created_at FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first();

  return result ? (result as unknown as User) : null;
}

/**
 * Busca usuário por ID
 */
export async function getUserById(db: D1Database, userId: number): Promise<User | null> {
  const result = await db
    .prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .bind(userId)
    .first();

  return result ? (result as unknown as User) : null;
}

/**
 * Registra novo usuário
 */
export async function registerUser(
  db: D1Database,
  input: RegisterInput
): Promise<{ user: User; error?: never } | { error: string; user?: never }> {
  // Validar email
  if (!input.email || !input.email.includes('@')) {
    return { error: 'Email inválido' };
  }

  // Validar senha (mínimo 6 caracteres)
  if (!input.password || input.password.length < 6) {
    return { error: 'Senha deve ter mínimo 6 caracteres' };
  }

  // Validar nome
  if (!input.name || input.name.trim().length < 2) {
    return { error: 'Nome deve ter mínimo 2 caracteres' };
  }

  // Verificar se email já existe
  const existingUser = await getUserByEmail(db, input.email);
  if (existingUser) {
    return { error: 'Email já cadastrado' };
  }

  // Hash da senha
  const { hash: passwordHash, salt } = hashPassword(input.password);
  const storedPassword = `${salt}:${passwordHash}`;

  try {
    const result = await db
      .prepare(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?) RETURNING id, email, name, role, created_at'
      )
      .bind(input.email.toLowerCase(), storedPassword, input.name.trim(), 'user')
      .first();

    return { user: result as unknown as User };
  } catch (error: any) {
    return { error: 'Erro ao criar usuário' };
  }
}

// ==================== LOGIN ====================

/**
 * Faz login com email e senha
 */
export async function loginUser(
  db: D1Database,
  input: LoginInput
): Promise<{ user: User; error?: never } | { error: string; user?: never }> {
  // Buscar usuário
  const userQuery = await db
    .prepare('SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?')
    .bind(input.email.toLowerCase())
    .first();

  if (!userQuery) {
    return { error: 'Email ou senha incorretos' };
  }

  const user = userQuery as any;
  const [salt, hash] = user.password_hash.split(':');

  // Verificar senha
  if (!verifyPassword(input.password, hash, salt)) {
    return { error: 'Email ou senha incorretos' };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    },
  };
}

// ==================== GERENCIAMENTO DE SESSÕES ====================

/**
 * Cria uma nova sessão
 */
export async function createSession(
  db: D1Database,
  userId: number,
  expiresInHours: number = 24
): Promise<AuthSession> {
  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt)
    .run();

  return { id: sessionId, user_id: userId, expires_at: expiresAt };
}

/**
 * Valida uma sessão
 */
export async function validateSession(
  db: D1Database,
  sessionId: string
): Promise<(AuthSession & { user: User }) | null> {
  const result = await db
    .prepare(
      `
      SELECT s.id, s.user_id, s.expires_at, u.id as uid, u.email, u.name, u.role, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
      `
    )
    .bind(sessionId)
    .first();

  if (!result) {
    return null;
  }

  const row = result as any;
  return {
    id: row.id,
    user_id: row.user_id,
    expires_at: row.expires_at,
    user: {
      id: row.uid,
      email: row.email,
      name: row.name,
      role: row.role,
      created_at: row.created_at,
    },
  };
}

/**
 * Deleta uma sessão (logout)
 */
export async function deleteSession(db: D1Database, sessionId: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM sessions WHERE id = ?')
    .bind(sessionId)
    .run();

  return result.success;
}

/**
 * Deleta todas as sessões de um usuário
 */
export async function deleteAllUserSessions(db: D1Database, userId: number): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM sessions WHERE user_id = ?')
    .bind(userId)
    .run();

  return result.success;
}

// ==================== MIDDLEWARE ====================

/**
 * Extrai session ID do cookie
 */
export function getSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = decodeURIComponent(value || '');
    return acc;
  }, {});

  return cookies['session_id'] || null;
}

/**
 * Valida autenticação
 * Retorna usuário ou null se não autenticado
 */
export async function getAuthenticatedUser(
  db: D1Database,
  request: Request
): Promise<User | null> {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) return null;

  const session = await validateSession(db, sessionId);
  return session?.user || null;
}

/**
 * Requer autenticação (lança erro se não autenticado)
 */
export async function requireAuth(db: D1Database, request: Request): Promise<User> {
  const user = await getAuthenticatedUser(db, request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Requer que seja admin
 */
export async function requireAdmin(db: D1Database, request: Request): Promise<User> {
  const user = await requireAuth(db, request);
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}
