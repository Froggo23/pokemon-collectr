import { formatUsd } from '@/shared/utils/format'
import type { ValuedLine } from '@/features/portfolio/utils/valuation'

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
        <p className="empty-title">No cards yet</p>
        <p className="empty-body">Search the catalog and add cards you own. Values update instantly.</p>
      </div>
    )
  }

  return (
    <ul className="inventory-list" data-testid="inventory-list">
      {lines.map((line) => (
        <li key={line.cardId} className="inventory-row" data-testid="inventory-row">
          <div className="row-main">
            <div className="row-title">{line.card.name}</div>
            <div className="row-sub">
              {line.card.set} · #{line.card.number} · {line.card.rarity}
            </div>
          </div>
          <div className="row-prices">
            <div className="unit-price" data-testid="unit-price">
              {formatUsd(line.unitPriceUsd)}
              <span className="unit-label">each</span>
            </div>
            <div className="line-total" data-testid="line-total">
              {formatUsd(line.lineTotalUsd)}
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
        </li>
      ))}
    </ul>
  )
}
