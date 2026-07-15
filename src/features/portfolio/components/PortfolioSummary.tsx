import { formatUsd } from '@/shared/utils/format'
import type { PortfolioValuation } from '../utils/valuation'

interface PortfolioSummaryProps {
  valuation: PortfolioValuation
  pricedAsOf?: string
}

export function PortfolioSummary({ valuation, pricedAsOf }: PortfolioSummaryProps) {
  return (
    <section className="portfolio-summary" aria-label="Portfolio total worth">
      <div className="summary-label">Inventory worth</div>
      <div className="summary-total" data-testid="portfolio-total">
        {formatUsd(valuation.totalUsd)}
      </div>
      <div className="summary-meta">
        <span data-testid="card-count">
          {valuation.cardCount} card{valuation.cardCount === 1 ? '' : 's'}
        </span>
        <span className="dot" aria-hidden>
          ·
        </span>
        <span data-testid="unique-count">{valuation.uniqueCount} unique</span>
        {pricedAsOf ? (
          <>
            <span className="dot" aria-hidden>
              ·
            </span>
            <span className="as-of">as of {pricedAsOf}</span>
          </>
        ) : null}
      </div>
    </section>
  )
}
