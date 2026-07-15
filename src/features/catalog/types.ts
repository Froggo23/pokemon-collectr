/** Catalog card identity + market price + art (from Pokémon TCG API). */
export interface CatalogCard {
  id: string
  name: string
  set: string
  setId: string
  number: string
  rarity: string
  /** Best available USD market mid/market from TCGPlayer */
  marketPriceUsd: number
  pricedAsOf: string
  /** small thumbnail */
  imageSmall: string
  /** large art */
  imageLarge: string
  /** TCGPlayer product page when available */
  tcgplayerUrl?: string
  artist?: string
  types?: string[]
  hp?: string
  /** raw price breakdown for UI */
  priceDetail?: {
    market?: number
    low?: number
    mid?: number
    high?: number
    variant?: string
  }
}
