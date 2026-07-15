import { useEffect, useState } from 'react'
import { loadFeaturedCatalog, searchCatalogAsync } from '../api/get-catalog'
import type { CatalogCard } from '../types'
import { formatUsd, formatUsdStrict } from '@/shared/utils/format'
import { CardArt } from './CardArt'

interface CatalogSearchProps {
  onAdd: (cardId: string, card?: CatalogCard) => void
  ownedIds: Set<string>
  onRegisterCard?: (card: CatalogCard) => void
}

export function CatalogSearch({ onAdd, ownedIds, onRegisterCard }: CatalogSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Featured cards on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadFeaturedCatalog()
      .then((cards) => {
        if (cancelled) return
        setResults(cards)
        cards.forEach((c) => onRegisterCard?.(c))
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load cards')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [onRegisterCard])

  // Debounced live search
  useEffect(() => {
    const q = query.trim()
    if (!q) return
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoading(true)
      searchCatalogAsync(q)
        .then((cards) => {
          if (cancelled) return
          setResults(cards)
          cards.forEach((c) => onRegisterCard?.(c))
          setError(null)
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Search failed')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [query, onRegisterCard])

  return (
    <section className="catalog-panel" aria-label="Browse and add cards">
      <div className="panel-head">
        <h2>Browse cards</h2>
        <p className="panel-hint">
          Live art &amp; TCGPlayer mids via{' '}
          <a href="https://docs.pokemontcg.io/" target="_blank" rel="noreferrer">
            pokemontcg.io
          </a>
        </p>
      </div>
      <label className="search-field">
        <span className="sr-only">Search cards</span>
        <input
          type="search"
          placeholder="Search Charizard, Umbreon, Prismatic…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="catalog-search"
        />
      </label>

      {error ? <p className="inline-error">{error}</p> : null}
      {loading ? <p className="loading-line">Loading cards…</p> : null}

      <div className="card-grid" data-testid="catalog-list">
        {results.map((card) => {
          const owned = ownedIds.has(card.id)
          return (
            <article key={card.id} className="card-tile" data-testid="catalog-card">
              <CardArt card={card} size="md" />
              <div className="tile-body">
                <h3 className="tile-title">{card.name}</h3>
                <p className="tile-meta">
                  {card.set} · #{card.number}
                </p>
                <p className="tile-rarity">{card.rarity}</p>
                <div className="tile-footer">
                  <div className="tile-price" data-testid="catalog-price">
                    <span className="price-main">{formatUsdStrict(card.marketPriceUsd)}</span>
                    {card.priceDetail?.low != null && card.priceDetail?.high != null ? (
                      <span className="price-range">
                        {formatUsd(card.priceDetail.low)}–{formatUsd(card.priceDetail.high)}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    data-testid="add-card"
                    onClick={() => onAdd(card.id, card)}
                  >
                    {owned ? '+1' : 'Add'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      {!loading && results.length === 0 ? (
        <p className="empty-inline">No cards match that search.</p>
      ) : null}
    </section>
  )
}
