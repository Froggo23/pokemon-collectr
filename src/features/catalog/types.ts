/** Catalog card identity + market price (data layer). */
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'

export interface CatalogCard {
  id: string
  name: string
  set: string
  number: string
  rarity: string
  /** USD market mid as of `pricedAsOf` */
  marketPriceUsd: number
  pricedAsOf: string
  imageUrl?: string
}
