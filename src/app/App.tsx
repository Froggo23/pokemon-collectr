import { useMemo } from 'react'
import { CatalogSearch } from '@/features/catalog/components/CatalogSearch'
import { InventoryList } from '@/features/inventory/components/InventoryList'
import { useInventory } from '@/features/inventory/hooks/use-inventory'
import { PortfolioSummary } from '@/features/portfolio/components/PortfolioSummary'
import { Layout } from '@/shared/components/Layout'

export default function App() {
  const { valuation, catalog, add, remove, inc, dec, backend, syncError } =
    useInventory()
  const ownedIds = useMemo(
    () => new Set(valuation.lines.map((l) => l.cardId)),
    [valuation.lines],
  )
  const pricedAsOf = catalog[0]?.pricedAsOf

  return (
    <Layout>
      <div className="backend-bar" data-testid="backend-mode">
        <span>
          Backend:{' '}
          <strong>
            {backend === 'supabase'
              ? 'Supabase'
              : backend === 'loading'
                ? 'Connecting…'
                : 'Local'}
          </strong>
        </span>
        {syncError ? <span className="backend-err">{syncError}</span> : null}
      </div>
      <PortfolioSummary valuation={valuation} pricedAsOf={pricedAsOf} />
      <div className="panels">
        <section className="inventory-panel" aria-label="Your inventory">
          <div className="panel-head">
            <h2>Your inventory</h2>
            <p className="panel-hint">Market value × quantity for each line</p>
          </div>
          <InventoryList
            lines={valuation.lines}
            onInc={inc}
            onDec={dec}
            onRemove={remove}
          />
        </section>
        <CatalogSearch onAdd={add} ownedIds={ownedIds} />
      </div>
    </Layout>
  )
}
