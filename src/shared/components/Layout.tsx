import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ◆
          </span>
          <div>
            <p className="brand-kicker">Collection</p>
            <h1 className="brand-title">Pokéfolio</h1>
          </div>
        </div>
        <p className="brand-sub">Card art · TCGPlayer market prices · portfolio total</p>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>
          Images &amp; prices from{' '}
          <a href="https://pokemontcg.io" target="_blank" rel="noreferrer">
            Pokémon TCG API
          </a>
          · not affiliated with Pokémon / TCGPlayer
        </span>
      </footer>
    </div>
  )
}
