import { formatUsdStrict } from '@/shared/utils/format'
import type { PortfolioValuation } from '../utils/valuation'

interface PortfolioSummaryProps {
  valuation: PortfolioValuation
  pricedAsOf?: string
}

export function PortfolioSummary({ valuation, pricedAsOf }: PortfolioSummaryProps) {
  return (
    <section className="portfolio-summary" aria-label="Portfolio total worth">
      <div className="summary-label">Collection worth</div>
      <div className="summary-total" data-testid="portfolio-total">
        {formatUsdStrict(valuation.totalUsd)}
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
            <span className="as-of">prices as of {pricedAsOf}</span>
          </>
        ) : null}
      </div>
      {valuation.lines.length > 0 ? (
        <div className="summary-strip" aria-hidden>
          {valuation.lines.slice(0, 8).map((l) => (
            <img
              key={l.cardId}
              src={l.card.imageSmall}
              alt=""
              className="strip-thumb"
              loading="lazy"
            />
          ))}
          {valuation.lines.length > 8 ? (
            <span className="strip-more">+{valuation.lines.length - 8}</span>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
