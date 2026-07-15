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
        <p className="brand-sub">Minimal inventory · live-style market mids</p>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>Seeded market prices · toy portfolio tracker</span>
      </footer>
    </div>
  )
}
