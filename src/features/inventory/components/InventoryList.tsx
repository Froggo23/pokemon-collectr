import { formatUsdStrict } from '@/shared/utils/format'
import type { ValuedLine } from '@/features/portfolio/utils/valuation'
import { CardArt } from '@/features/catalog/components/CardArt'

interface InventoryListProps {
  lines: ValuedLine[]
  onInc: (cardId: string) => void
  onDec: (cardId: string) => void
  onRemove: (cardId: string) => void
}

export function InventoryList({ lines, onInc, onDec, onRemove }: InventoryListProps) {
  if (lines.length === 0) {
    return (
      <div className="empty-state" data-testid="inventory-empty">
        <p className="empty-title">Your binder is empty</p>
        <p className="empty-body">
          Browse the catalog on the right — real card art loads from the Pokémon TCG API. Tap{' '}
          <strong>Add</strong> to start valuing your collection.
        </p>
      </div>
    )
  }

  return (
    <ul className="inventory-grid" data-testid="inventory-list">
      {lines.map((line) => (
        <li key={line.cardId} className="inventory-card" data-testid="inventory-row">
          <CardArt card={line.card} size="lg" priority />
          <div className="inv-body">
            <div className="inv-top">
              <h3 className="tile-title">{line.card.name}</h3>
              <p className="tile-meta">
                {line.card.set} · #{line.card.number}
              </p>
              <p className="tile-rarity">{line.card.rarity}</p>
            </div>
            <div className="inv-prices">
              <div>
                <span className="label">Each</span>
                <div className="unit-price" data-testid="unit-price">
                  {formatUsdStrict(line.unitPriceUsd)}
                </div>
              </div>
              <div>
                <span className="label">Line</span>
                <div className="line-total" data-testid="line-total">
                  {formatUsdStrict(line.lineTotalUsd)}
                </div>
              </div>
            </div>
            <div className="row-qty">
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={`Decrease ${line.card.name}`}
                onClick={() => onDec(line.cardId)}
              >
                −
              </button>
              <span className="qty" data-testid="qty">
                {line.quantity}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={`Increase ${line.card.name}`}
                onClick={() => onInc(line.cardId)}
              >
                +
              </button>
              <button
                type="button"
                className="btn btn-text"
                aria-label={`Remove ${line.card.name}`}
                onClick={() => onRemove(line.cardId)}
              >
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
