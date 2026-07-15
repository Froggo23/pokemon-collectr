import { SEED_CATALOG } from '../data/seed-catalog'
import type { CatalogCard } from '../types'
import { fetchCardById, fetchFeaturedCards, searchCards } from './pokemontcg'

/** Synchronous seed for tests / offline fallback. */
export function getCatalog(): CatalogCard[] {
  return SEED_CATALOG
}

export function getCardById(id: string): CatalogCard | undefined {
  return SEED_CATALOG.find((c) => c.id === id)
}

/** @deprecated prefer searchCatalogAsync — kept for tests against seed */
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

export async function searchCatalogAsync(query: string, page = 1): Promise<CatalogCard[]> {
  try {
    const pageData = await searchCards(query, page, 24)
    if (pageData.cards.length) return pageData.cards
  } catch (e) {
    console.warn('pokemontcg search failed, seed fallback', e)
  }
  return searchCatalog(query)
}

export async function loadFeaturedCatalog(): Promise<CatalogCard[]> {
  try {
    const featured = await fetchFeaturedCards()
    if (featured.length) return featured
  } catch (e) {
    console.warn('pokemontcg featured failed, seed fallback', e)
  }
  return SEED_CATALOG
}

export async function resolveCard(id: string): Promise<CatalogCard | undefined> {
  const live = await fetchCardById(id)
  if (live) return live
  return getCardById(id)
}

export { fetchCardsByIds } from './pokemontcg'
