import { getSupabase } from '@/shared/lib/supabase'
import type { CatalogCard } from '../types'
import { SEED_CATALOG } from '../data/seed-catalog'

interface DbCard {
  id: string
  name: string
  set_name: string
  number: string
  rarity: string
  market_price_usd: number | string
  priced_as_of: string
  image_small?: string
  image_large?: string
}

function mapRow(row: DbCard): CatalogCard {
  const id = row.id
  const [setId] = id.split('-')
  return {
    id,
    name: row.name,
    set: row.set_name,
    setId: setId || 'unknown',
    number: row.number,
    rarity: row.rarity,
    marketPriceUsd: Number(row.market_price_usd),
    pricedAsOf: row.priced_as_of,
    imageSmall: row.image_small || '',
    imageLarge: row.image_large || row.image_small || '',
  }
}

/** Load catalog from Supabase; fall back to seed if offline/unconfigured. */
export async function fetchCatalogRemote(): Promise<CatalogCard[] | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from('pokefolio_cards')
    .select('id,name,set_name,number,rarity,market_price_usd,priced_as_of')
    .order('name')
  if (error || !data?.length) return null
  return (data as DbCard[]).map(mapRow)
}

/** Upsert seed catalog into Supabase (idempotent). */
export async function seedCatalogRemote(): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'not_configured' }
  const rows = SEED_CATALOG.map((c) => ({
    id: c.id,
    name: c.name,
    set_name: c.set,
    number: c.number,
    rarity: c.rarity,
    market_price_usd: c.marketPriceUsd,
    priced_as_of: c.pricedAsOf,
  }))
  const { error } = await sb.from('pokefolio_cards').upsert(rows, { onConflict: 'id' })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
