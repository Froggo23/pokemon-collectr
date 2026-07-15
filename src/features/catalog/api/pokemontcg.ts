/**
 * Live data access: https://docs.pokemontcg.io/
 * Free public API — card art + TCGPlayer market prices (no key required; key optional for higher limits).
 */
import type { CatalogCard } from '../types'

const BASE = 'https://api.pokemontcg.io/v2'
const API_KEY = (import.meta.env.VITE_POKEMONTCG_API_KEY as string | undefined)?.trim()

export interface SearchPage {
  cards: CatalogCard[]
  totalCount: number
  page: number
  pageSize: number
}

interface ApiCard {
  id: string
  name: string
  number: string
  rarity?: string
  artist?: string
  hp?: string
  types?: string[]
  set: { id: string; name: string }
  images: { small: string; large: string }
  tcgplayer?: {
    url?: string
    updatedAt?: string
    prices?: Record<
      string,
      { low?: number; mid?: number; high?: number; market?: number; directLow?: number | null }
    >
  }
  cardmarket?: {
    updatedAt?: string
    prices?: { averageSellPrice?: number; trendPrice?: number; lowPrice?: number }
  }
}

function pickPrice(card: ApiCard): CatalogCard['priceDetail'] & { marketPriceUsd: number; pricedAsOf: string } {
  const variants = card.tcgplayer?.prices
  if (variants) {
    // Prefer holofoil / normal / reverseHolofoil market
    const preferred = [
      'holofoil',
      'normal',
      'reverseHolofoil',
      '1stEditionHolofoil',
      'unlimitedHolofoil',
      ...Object.keys(variants),
    ]
    for (const key of preferred) {
      const p = variants[key]
      if (!p) continue
      const market = p.market ?? p.mid ?? p.low
      if (market != null && market > 0) {
        return {
          marketPriceUsd: market,
          pricedAsOf: (card.tcgplayer?.updatedAt || new Date().toISOString().slice(0, 10)).replace(
            /\//g,
            '-',
          ),
          market: p.market,
          low: p.low,
          mid: p.mid,
          high: p.high,
          variant: key,
        }
      }
    }
  }
  // EU fallback
  const cm = card.cardmarket?.prices
  const euro = cm?.averageSellPrice ?? cm?.trendPrice ?? cm?.lowPrice
  if (euro != null && euro > 0) {
    // rough EUR→USD for display continuity when TCGPlayer missing
    const usd = Math.round(euro * 1.08 * 100) / 100
    return {
      marketPriceUsd: usd,
      pricedAsOf: (card.cardmarket?.updatedAt || new Date().toISOString().slice(0, 10)).replace(
        /\//g,
        '-',
      ),
      market: usd,
      variant: 'cardmarket-avg',
    }
  }
  return { marketPriceUsd: 0, pricedAsOf: new Date().toISOString().slice(0, 10) }
}

export function mapApiCard(card: ApiCard): CatalogCard {
  const price = pickPrice(card)
  return {
    id: card.id,
    name: card.name,
    set: card.set.name,
    setId: card.set.id,
    number: card.number,
    rarity: card.rarity || '—',
    marketPriceUsd: price.marketPriceUsd,
    pricedAsOf: price.pricedAsOf,
    imageSmall: card.images.small,
    imageLarge: card.images.large,
    tcgplayerUrl: card.tcgplayer?.url,
    artist: card.artist,
    types: card.types,
    hp: card.hp,
    priceDetail: {
      market: price.market,
      low: price.low,
      mid: price.mid,
      high: price.high,
      variant: price.variant,
    },
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (API_KEY) headers['X-Api-Key'] = API_KEY
  const res = await fetch(`${BASE}${path}`, { headers })
  if (!res.ok) {
    throw new Error(`pokemontcg ${res.status}: ${await res.text().then((t) => t.slice(0, 200))}`)
  }
  return res.json() as Promise<T>
}

const cache = new Map<string, { at: number; data: unknown }>()
const TTL = 1000 * 60 * 10 // 10 min

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.data as T)
  return fn().then((data) => {
    cache.set(key, { at: Date.now(), data })
    return data
  })
}

/** Search cards by free text (name, set, number). */
export async function searchCards(query: string, page = 1, pageSize = 24): Promise<SearchPage> {
  const q = query.trim()
  const key = `search:${q}:${page}:${pageSize}`
  return cached(key, async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      orderBy: '-set.releaseDate',
    })
    if (q) {
      // Lucene query — name match is most reliable on the public API
      const safe = q.replace(/["\\]/g, '').trim()
      if (safe) params.set('q', `name:${safe}*`)
    }
    const json = await apiGet<{
      data: ApiCard[]
      totalCount: number
      page: number
      pageSize: number
    }>(`/cards?${params}`)
    return {
      cards: json.data.map(mapApiCard),
      totalCount: json.totalCount,
      page: json.page,
      pageSize: json.pageSize,
    }
  })
}

/** Featured / popular chase cards for empty-state browse. */
export async function fetchFeaturedCards(): Promise<CatalogCard[]> {
  return cached('featured-v2', async () => {
    // High-interest modern + classic hits via API queries
    const queries = [
      'name:charizard rarity:"Rare Holo" OR rarity:"Special Illustration Rare"',
      'name:pikachu',
      'name:umbreon',
      'name:mewtwo',
      'name:lugia',
    ]
    const pages = await Promise.all(
      queries.map((q) =>
        apiGet<{ data: ApiCard[] }>(
          `/cards?${new URLSearchParams({ q, pageSize: '8', orderBy: '-set.releaseDate' })}`,
        ).catch(() => ({ data: [] as ApiCard[] })),
      ),
    )
    const byId = new Map<string, CatalogCard>()
    for (const page of pages) {
      for (const c of page.data) {
        const mapped = mapApiCard(c)
        if (!byId.has(mapped.id) && mapped.imageLarge) byId.set(mapped.id, mapped)
      }
    }
    // Prefer cards with market prices
    return [...byId.values()]
      .sort((a, b) => b.marketPriceUsd - a.marketPriceUsd)
      .slice(0, 36)
  })
}

export async function fetchCardById(id: string): Promise<CatalogCard | null> {
  return cached(`card:${id}`, async () => {
    try {
      const json = await apiGet<{ data: ApiCard }>(`/cards/${encodeURIComponent(id)}`)
      return mapApiCard(json.data)
    } catch {
      return null
    }
  })
}

/** Resolve many IDs (inventory) with concurrent batching. */
export async function fetchCardsByIds(ids: string[]): Promise<Map<string, CatalogCard>> {
  const unique = [...new Set(ids)]
  const map = new Map<string, CatalogCard>()
  await Promise.all(
    unique.map(async (id) => {
      const c = await fetchCardById(id)
      if (c) map.set(id, c)
    }),
  )
  return map
}
