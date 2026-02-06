import bcrypt from 'bcryptjs';

export interface User {
  username: string;
  password: string; // hashed password
  role: 'admin' | 'user';
  name?: string;
  email?: string;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('isAuthenticated') === 'true';
}

/**
 * Get current user from localStorage (client-side)
 */
export function getCurrentUser(): { username: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Set authentication in localStorage (client-side)
 */
export function setAuthentication(username: string, role: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('currentUser', JSON.stringify({ username, role }));
}

/**
 * Clear authentication (client-side)
 */
export function clearAuthentication(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('currentUser');
}
