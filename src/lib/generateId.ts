/**
 * Utility function for generating custom IDs with prefixes
 * 
 * Format: [PREFIX]-A[NUMBER]
 * Examples: EST-A001, KIT-A002, RES-A003
 * 
 * Prefixes:
 * - EST: Items (Estoque)
 * - KIT: Kits
 * - RES: Reservations
 * - POR: Portfolio
 * - CLI: Clients
 * 
 * Note on Race Conditions:
 * While this implementation has a potential race condition where concurrent
 * requests might generate duplicate IDs, this is mitigated by:
 * 1. The database UNIQUE constraint on custom_id column will reject duplicates
 * 2. The zero-padded format (001, 002, etc.) ensures correct lexicographic ordering
 * 3. In practice, concurrent item/kit/reservation creation is rare in this application
 * For high-concurrency scenarios, consider using database sequences or UUID-based IDs.
 */

/**
 * Generate a custom ID with the specified prefix
 * @param prefix - The 3-letter prefix (EST, KIT, RES, POR, CLI)
 * @param lastId - The last custom ID used, or null if this is the first
 * @returns A new custom ID in the format PREFIX-A###
 */
export function generateCustomId(prefix: string, lastId: string | null): string {
  // If no previous ID, start with 001
  if (!lastId) {
    return `${prefix}-A001`;
  }
  
  // Extract number from the last ID (ex: "KIT-A005" -> 5)
  // Enforce exactly 3 digits to match validation
  const match = lastId.match(/-A(\d{3})$/);
  if (!match) {
    // If the format is invalid, start fresh
    return `${prefix}-A001`;
  }
  
  const lastNumber = parseInt(match[1], 10);
  const nextNumber = lastNumber + 1;
  
  // Format with 3 digits (ex: 6 -> "006")
  // Zero-padding ensures correct lexicographic sorting (EST-A001 < EST-A002 < EST-A100)
  return `${prefix}-A${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Validate that a custom ID has the correct format
 * @param id - The ID to validate
 * @param prefix - The expected prefix
 * @returns True if valid, false otherwise
 */
export function validateCustomId(id: string, prefix: string): boolean {
  const regex = new RegExp(`^${prefix}-A\\d{3}$`);
  return regex.test(id);
}
