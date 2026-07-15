import type { CatalogCard } from '@/features/catalog/types'
import type { Inventory, InventoryLine } from '@/features/inventory/types'

export interface ValuedLine {
  cardId: string
  quantity: number
  unitPriceUsd: number
  lineTotalUsd: number
  card: CatalogCard
}

export interface PortfolioValuation {
  lines: ValuedLine[]
  totalUsd: number
  cardCount: number
  uniqueCount: number
}

/**
 * Pure valuation: unit market × qty for each owned line; portfolio total is the sum.
 * Prices come only from the catalog map — never from UI hardcodes.
 */
export function buildPriceMap(catalog: CatalogCard[]): Map<string, CatalogCard> {
  return new Map(catalog.map((c) => [c.id, c]))
}

export function lineTotalUsd(unitPriceUsd: number, quantity: number): number {
  if (!Number.isFinite(unitPriceUsd) || !Number.isFinite(quantity) || quantity <= 0) {
    return 0
  }
  return unitPriceUsd * quantity
}

export function valueInventory(
  inventory: Inventory,
  catalog: CatalogCard[],
): PortfolioValuation {
  const prices = buildPriceMap(catalog)
  const lines: ValuedLine[] = []
  let totalUsd = 0
  let cardCount = 0

  for (const line of inventory) {
    if (line.quantity <= 0) continue
    const card = prices.get(line.cardId)
    if (!card) continue
    const unit = card.marketPriceUsd
    const lineTotal = lineTotalUsd(unit, line.quantity)
    lines.push({
      cardId: line.cardId,
      quantity: line.quantity,
      unitPriceUsd: unit,
      lineTotalUsd: lineTotal,
      card,
    })
    totalUsd += lineTotal
    cardCount += line.quantity
  }

  return {
    lines,
    totalUsd,
    cardCount,
    uniqueCount: lines.length,
  }
}

/** Immutable inventory helpers used by state + tests. */
export function addCard(inventory: Inventory, cardId: string, qty = 1): Inventory {
  if (qty <= 0) return inventory
  const existing = inventory.find((l) => l.cardId === cardId)
  if (existing) {
    return inventory.map((l) =>
      l.cardId === cardId ? { ...l, quantity: l.quantity + qty } : l,
    )
  }
  return [...inventory, { cardId, quantity: qty }]
}

export function setQuantity(inventory: Inventory, cardId: string, quantity: number): Inventory {
  if (quantity <= 0) {
    return inventory.filter((l) => l.cardId !== cardId)
  }
  const existing = inventory.find((l) => l.cardId === cardId)
  if (!existing) {
    return [...inventory, { cardId, quantity }]
  }
  return inventory.map((l) => (l.cardId === cardId ? { ...l, quantity } : l))
}

export function removeCard(inventory: Inventory, cardId: string): Inventory {
  return inventory.filter((l) => l.cardId !== cardId)
}

export function decrementCard(inventory: Inventory, cardId: string): Inventory {
  const line: InventoryLine | undefined = inventory.find((l) => l.cardId === cardId)
  if (!line) return inventory
  if (line.quantity <= 1) return removeCard(inventory, cardId)
  return setQuantity(inventory, cardId, line.quantity - 1)
}
