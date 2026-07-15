import { useMemo, useState } from 'react'
import { searchCatalog } from '../api/get-catalog'
import { formatUsd } from '@/shared/utils/format'

interface CatalogSearchProps {
  onAdd: (cardId: string) => void
  ownedIds: Set<string>
}

export function CatalogSearch({ onAdd, ownedIds }: CatalogSearchProps) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchCatalog(query).slice(0, 12), [query])

  return (
    <section className="catalog-panel" aria-label="Add cards from catalog">
      <div className="panel-head">
        <h2>Add from catalog</h2>
        <p className="panel-hint">Search by name, set, or number</p>
      </div>
      <label className="search-field">
        <span className="sr-only">Search cards</span>
        <input
          type="search"
          placeholder="e.g. Charizard, Prismatic, 4/102"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="catalog-search"
        />
      </label>
      <ul className="catalog-list" data-testid="catalog-list">
        {results.map((card) => {
          const owned = ownedIds.has(card.id)
          return (
            <li key={card.id} className="catalog-row">
              <div className="row-main">
                <div className="row-title">{card.name}</div>
                <div className="row-sub">
                  {card.set} · #{card.number}
                </div>
              </div>
              <div className="catalog-price" data-testid="catalog-price">
                {formatUsd(card.marketPriceUsd)}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                data-testid="add-card"
                onClick={() => onAdd(card.id)}
              >
                {owned ? '+1' : 'Add'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
