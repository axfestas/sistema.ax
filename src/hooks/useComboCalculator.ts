import { useMemo, useEffect, useState } from 'react'
import type { CartItem } from '@/components/CartContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComboItemDef {
  product_type: 'item' | 'kit' | 'sweet' | 'design' | 'theme'
  product_id: number
  product_name?: string
  required_quantity: number
}

export interface ComboCategoryDef {
  category_name: string
  product_section: 'items' | 'sweets' | 'designs' | 'themes'
}

export interface ComboDef {
  id: number
  name: string
  type: 'products' | 'category' | 'mixed'
  discount_type: 'fixed_price' | 'percentage' | 'fixed_amount'
  discount_value: number
  min_quantity: number
  priority: number
  is_active: number
  items: ComboItemDef[]
  categories: ComboCategoryDef[]
}

export interface AppliedCombo {
  combo: ComboDef
  /** Cart item ids that are part of this combo */
  matchedItemIds: string[]
  /** Original subtotal of matched items */
  originalSubtotal: number
  /** Discount amount granted by this combo */
  discountAmount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Given a cart item id like "item-5", "kit-3", "sweet-2",
 * extract the product type and numeric id.
 */
function parseCartId(id: string): { type: string; numericId: number } | null {
  const parts = id.split('-')
  if (parts.length < 2) return null
  const numericId = parseInt(parts[parts.length - 1])
  if (isNaN(numericId)) return null
  const type = parts.slice(0, -1).join('-')
  return { type, numericId }
}

/**
 * Map cart item id type prefix to combo product_type.
 * cart prefix "item" → combo type "item"
 * cart prefix "kit"  → combo type "kit"
 * etc.
 */
function cartTypeToCombotype(cartType: string): string {
  const map: Record<string, string> = {
    item: 'item',
    kit: 'kit',
    sweet: 'sweet',
    design: 'design',
    theme: 'theme',
  }
  return map[cartType] ?? cartType
}

/**
 * Infer the product_section for a category-based combo check.
 * Cart items with prefix "item" belong to section "items", etc.
 */
function cartTypeToSection(cartType: string): string {
  const map: Record<string, string> = {
    item: 'items',
    kit: 'items',
    sweet: 'sweets',
    design: 'designs',
    theme: 'themes',
  }
  return map[cartType] ?? 'items'
}

/**
 * Calculate applied combos for the given cart items and combo definitions.
 * Items already claimed by a higher-priority combo are excluded from subsequent checks.
 */
export function calculateCombos(
  cartItems: CartItem[],
  combos: ComboDef[]
): AppliedCombo[] {
  // Work with a mutable map of remaining quantities per cart item id
  const remaining = new Map<string, number>()
  for (const item of cartItems) {
    remaining.set(item.id, item.quantity)
  }

  const applied: AppliedCombo[] = []

  // Sort combos by priority descending (higher priority applied first)
  const sorted = [...combos].sort((a, b) => b.priority - a.priority)

  for (const combo of sorted) {
    if (!combo.is_active) continue

    // Collect candidate items for this combo
    const productMatches: { id: string; qty: number; unitPrice: number }[] = []
    const categoryMatches: { id: string; qty: number; unitPrice: number }[] = []

    // ── Product matching ───────────────────────────────────────────────────
    if (combo.type === 'products' || combo.type === 'mixed') {
      let allMatched = true
      for (const requiredItem of combo.items) {
        // Find cart items that match this product
        const matchingCartItems = cartItems.filter(ci => {
          const parsed = parseCartId(ci.id)
          if (!parsed) return false
          return (
            cartTypeToCombotype(parsed.type) === requiredItem.product_type &&
            parsed.numericId === requiredItem.product_id
          )
        })

        const totalAvailable = matchingCartItems.reduce(
          (sum, ci) => sum + (remaining.get(ci.id) ?? 0),
          0
        )

        if (totalAvailable < requiredItem.required_quantity) {
          allMatched = false
          break
        }

        // Add matched items to list
        let needed = requiredItem.required_quantity
        for (const ci of matchingCartItems) {
          const avail = remaining.get(ci.id) ?? 0
          if (avail <= 0) continue
          const take = Math.min(avail, needed)
          productMatches.push({ id: ci.id, qty: take, unitPrice: ci.price })
          needed -= take
          if (needed <= 0) break
        }
      }

      if (!allMatched) {
        productMatches.length = 0
      }
    }

    // ── Category matching ──────────────────────────────────────────────────
    if (combo.type === 'category' || combo.type === 'mixed') {
      // Find cart items that belong to any of the combo categories
      // NOTE: category_name is stored on cart items via the product's category field.
      // Since CartItem doesn't currently carry category, we match by section only
      // if no product name info. We'll use a category field if available (extended cart item).
      for (const ci of cartItems) {
        const parsed = parseCartId(ci.id)
        if (!parsed) continue
        const section = cartTypeToSection(parsed.type)

        // Check if this item's section matches any combo category's section
        const matches = combo.categories.some(cc => cc.product_section === section)
        if (matches && (remaining.get(ci.id) ?? 0) > 0) {
          categoryMatches.push({ id: ci.id, qty: remaining.get(ci.id) ?? 0, unitPrice: ci.price })
        }
      }

      const totalCategoryQty = categoryMatches.reduce((s, m) => s + m.qty, 0)
      if (totalCategoryQty < combo.min_quantity) {
        categoryMatches.length = 0
      }
    }

    // ── Determine if combo is triggered ───────────────────────────────────
    let triggered = false
    let matchedIds: string[] = []
    let originalSubtotal = 0

    if (combo.type === 'products' && productMatches.length > 0) {
      triggered = true
      matchedIds = Array.from(new Set(productMatches.map(m => m.id)))
      originalSubtotal = productMatches.reduce((s, m) => s + m.qty * m.unitPrice, 0)
    } else if (combo.type === 'category' && categoryMatches.length > 0) {
      triggered = true
      // Only take up to min_quantity items (the cheapest ones get the discount, or all if enough)
      const taken = categoryMatches.slice()
      let total = 0
      let count = 0
      for (const m of taken) {
        if (count >= combo.min_quantity) break
        const take = Math.min(m.qty, combo.min_quantity - count)
        total += take * m.unitPrice
        count += take
        matchedIds.push(m.id)
      }
      originalSubtotal = total
    } else if (combo.type === 'mixed' && productMatches.length > 0 && categoryMatches.length > 0) {
      triggered = true
      const productIds = Array.from(new Set(productMatches.map(m => m.id)))
      const catIds = categoryMatches.map(m => m.id)
      matchedIds = Array.from(new Set([...productIds, ...catIds]))
      originalSubtotal =
        productMatches.reduce((s, m) => s + m.qty * m.unitPrice, 0) +
        categoryMatches.reduce((s, m) => s + m.qty * m.unitPrice, 0)
    }

    if (!triggered) continue

    // ── Calculate discount ─────────────────────────────────────────────────
    let discountAmount = 0
    if (combo.discount_type === 'fixed_price') {
      discountAmount = Math.max(0, originalSubtotal - combo.discount_value)
    } else if (combo.discount_type === 'percentage') {
      discountAmount = originalSubtotal * (combo.discount_value / 100)
    } else {
      // fixed_amount
      discountAmount = Math.min(combo.discount_value, originalSubtotal)
    }

    applied.push({
      combo,
      matchedItemIds: matchedIds,
      originalSubtotal,
      discountAmount,
    })

    // Mark matched items as consumed so other combos can't claim them
    for (const id of matchedIds) {
      remaining.set(id, 0)
    }
  }

  return applied
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComboCalculator(cartItems: CartItem[]) {
  const [combos, setCombos] = useState<ComboDef[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/combos?active=true')
      .then(r => r.ok ? r.json() as Promise<ComboDef[]> : Promise.resolve([] as ComboDef[]))
      .then(data => { setCombos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const appliedCombos = useMemo(
    () => (loading ? [] : calculateCombos(cartItems, combos)),
    [cartItems, combos, loading]
  )

  const totalDiscount = useMemo(
    () => appliedCombos.reduce((s, a) => s + a.discountAmount, 0),
    [appliedCombos]
  )

  return { appliedCombos, totalDiscount, loadingCombos: loading }
}
