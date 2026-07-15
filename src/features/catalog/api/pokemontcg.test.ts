import { describe, expect, it } from 'vitest'
import { mapApiCard } from './pokemontcg'

describe('mapApiCard (real API shape → CatalogCard)', () => {
  it('maps images and TCGPlayer market price from API payload', () => {
    const card = mapApiCard({
      id: 'base1-4',
      name: 'Charizard',
      number: '4',
      rarity: 'Rare Holo',
      set: { id: 'base1', name: 'Base' },
      images: {
        small: 'https://images.pokemontcg.io/base1/4.png',
        large: 'https://images.pokemontcg.io/base1/4_hires.png',
      },
      tcgplayer: {
        url: 'https://prices.pokemontcg.io/tcgplayer/base1-4',
        updatedAt: '2026/07/15',
        prices: {
          holofoil: { low: 300, mid: 400, high: 600, market: 412.5 },
        },
      },
    })

    expect(card.imageLarge).toBe('https://images.pokemontcg.io/base1/4_hires.png')
    expect(card.imageSmall).toContain('pokemontcg.io')
    expect(card.marketPriceUsd).toBe(412.5)
    expect(card.priceDetail?.variant).toBe('holofoil')
    expect(card.pricedAsOf).toContain('2026')
  })
})
