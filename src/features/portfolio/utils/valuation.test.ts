import { describe, expect, it } from 'vitest'
import { getCatalog, getCardById } from '@/features/catalog/api/get-catalog'
import {
  addCard,
  decrementCard,
  lineTotalUsd,
  removeCard,
  setQuantity,
  valueInventory,
} from './valuation'

describe('lineTotalUsd', () => {
  it('multiplies unit market price by quantity', () => {
    expect(lineTotalUsd(10.5, 3)).toBe(31.5)
    expect(lineTotalUsd(412.5, 2)).toBe(825)
  })

  it('returns 0 for non-positive quantity', () => {
    expect(lineTotalUsd(10, 0)).toBe(0)
    expect(lineTotalUsd(10, -1)).toBe(0)
  })
})

describe('valueInventory (shipped catalog + inventory math)', () => {
  const catalog = getCatalog()

  it('computes portfolio total as sum of unitPrice × qty for multi-card fixtures', () => {
    const charizard = getCardById('base1-4')
    const pikachu = getCardById('base1-58')
    const umbreon = getCardById('sv-prismatic-evolutions-161')
    expect(charizard && pikachu && umbreon).toBeTruthy()

    let inv = addCard([], 'base1-4', 2)
    inv = addCard(inv, 'base1-58', 5)
    inv = addCard(inv, 'sv-prismatic-evolutions-161', 1)

    const valued = valueInventory(inv, catalog)

    const expected =
      charizard!.marketPriceUsd * 2 +
      pikachu!.marketPriceUsd * 5 +
      umbreon!.marketPriceUsd * 1

    expect(valued.totalUsd).toBe(expected)
    expect(valued.cardCount).toBe(2 + 5 + 1)
    expect(valued.uniqueCount).toBe(3)

    // Each line total is unit × qty from catalog prices
    for (const line of valued.lines) {
      const card = getCardById(line.cardId)!
      expect(line.unitPriceUsd).toBe(card.marketPriceUsd)
      expect(line.lineTotalUsd).toBe(card.marketPriceUsd * line.quantity)
    }

    // Total equals sum of line totals (not a hardcoded constant)
    const sumLines = valued.lines.reduce((s, l) => s + l.lineTotalUsd, 0)
    expect(valued.totalUsd).toBe(sumLines)
  })

  it('updates total when quantity changes via setQuantity / remove', () => {
    const card = getCardById('sv-obsidian-flames-199')!
    let inv = addCard([], card.id, 1)
    let v = valueInventory(inv, catalog)
    expect(v.totalUsd).toBe(card.marketPriceUsd)

    inv = setQuantity(inv, card.id, 4)
    v = valueInventory(inv, catalog)
    expect(v.totalUsd).toBe(card.marketPriceUsd * 4)

    inv = decrementCard(inv, card.id)
    v = valueInventory(inv, catalog)
    expect(v.totalUsd).toBe(card.marketPriceUsd * 3)

    inv = removeCard(inv, card.id)
    v = valueInventory(inv, catalog)
    expect(v.totalUsd).toBe(0)
    expect(v.lines).toHaveLength(0)
  })

  it('skips unknown card ids and zero-qty lines', () => {
    const inv = [
      { cardId: 'does-not-exist', quantity: 9 },
      { cardId: 'base1-4', quantity: 0 },
    ]
    const v = valueInventory(inv, catalog)
    expect(v.totalUsd).toBe(0)
    expect(v.lines).toHaveLength(0)
  })
})
