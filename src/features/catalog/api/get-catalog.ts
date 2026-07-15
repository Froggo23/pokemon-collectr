import { SEED_CATALOG } from '../data/seed-catalog'
import type { CatalogCard } from '../types'

/** Data-access: catalog lookup. UI never hardcodes prices. */
export function getCatalog(): CatalogCard[] {
  return SEED_CATALOG
}

export function getCardById(id: string): CatalogCard | undefined {
  return SEED_CATALOG.find((c) => c.id === id)
}

export function searchCatalog(query: string): CatalogCard[] {
  const q = query.trim().toLowerCase()
  if (!q) return SEED_CATALOG
  return SEED_CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.set.toLowerCase().includes(q) ||
      c.number.toLowerCase().includes(q) ||
      c.rarity.toLowerCase().includes(q),
  )
}
