import { useMemo } from 'react'
import { CatalogSearch } from '@/features/catalog/components/CatalogSearch'
import { InventoryList } from '@/features/inventory/components/InventoryList'
import { useInventory } from '@/features/inventory/hooks/use-inventory'
import { PortfolioSummary } from '@/features/portfolio/components/PortfolioSummary'
import { Layout } from '@/shared/components/Layout'

export default function App() {
  const { valuation, catalog, add, remove, inc, dec, backend, syncError, registerCard } =
    useInventory()
  const ownedIds = useMemo(
    () => new Set(valuation.lines.map((l) => l.cardId)),
    [valuation.lines],
  )
  const pricedAsOf =
    valuation.lines[0]?.card.pricedAsOf || catalog.find((c) => c.pricedAsOf)?.pricedAsOf

  const backendLabel =
    backend === 'supabase'
      ? 'Supabase + live TCG API'
      : backend === 'live-api'
        ? 'Live Pokémon TCG API'
        : backend === 'loading'
          ? 'Loading cards…'
          : 'Offline seed'

  return (
    <Layout>
      <div className="backend-bar" data-testid="backend-mode">
        <span>
          Data · <strong>{backendLabel}</strong>
        </span>
        {syncError ? <span className="backend-err">{syncError}</span> : null}
      </div>
      <PortfolioSummary valuation={valuation} pricedAsOf={pricedAsOf} />
      <div className="panels">
        <section className="inventory-panel" aria-label="Your inventory">
          <div className="panel-head">
            <h2>Your binder</h2>
            <p className="panel-hint">Market value × quantity — card art included</p>
          </div>
          <InventoryList
            lines={valuation.lines}
            onInc={inc}
            onDec={dec}
            onRemove={remove}
          />
        </section>
        <CatalogSearch
          onAdd={(id, card) => add(id, card)}
          ownedIds={ownedIds}
          onRegisterCard={registerCard}
        />
      </div>
    </Layout>
  )
}
