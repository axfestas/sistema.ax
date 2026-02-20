/**
 * Formata IDs numéricos para padrão legível
 * 
 * Formato: [PREFIX]-A[NUMBER]
 * Exemplos: CLI-A001, EST-A001, KIT-A002, etc.
 */

export function formatClientId(id: number): string {
  return `CLI-A${String(id).padStart(3, '0')}`;
}

export function formatItemId(id: number): string {
  return `EST-A${String(id).padStart(3, '0')}`;
}

export function formatKitId(id: number): string {
  return `KIT-A${String(id).padStart(3, '0')}`;
}

export function formatSweetId(id: number): string {
  return `DOC-A${String(id).padStart(3, '0')}`;
}

export function formatDesignId(id: number): string {
  return `DES-A${String(id).padStart(3, '0')}`;
}

export function formatThemeId(id: number): string {
  return `TM-A${String(id).padStart(3, '0')}`;
}

export function formatReservationId(id: number): string {
  return `RES-A${String(id).padStart(3, '0')}`;
}

// Função genérica
export function formatCustomId(prefix: string, id: number): string {
  return `${prefix}-A${String(id).padStart(3, '0')}`;
}

// Tipos TypeScript
export type ItemType = 'item' | 'kit' | 'sweet' | 'design';

export function formatIdByType(type: ItemType, id: number): string {
  switch (type) {
    case 'item':
      return formatItemId(id);
    case 'kit':
      return formatKitId(id);
    case 'sweet':
      return formatSweetId(id);
    case 'design':
      return formatDesignId(id);
    default:
      return String(id);
  }
}
