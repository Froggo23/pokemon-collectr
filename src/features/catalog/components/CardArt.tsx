import { useState } from 'react'
import type { CatalogCard } from '../types'

interface CardArtProps {
  card: Pick<CatalogCard, 'name' | 'imageSmall' | 'imageLarge'>
  size?: 'sm' | 'md' | 'lg'
  priority?: boolean
}

export function CardArt({ card, size = 'md', priority = false }: CardArtProps) {
  const [src, setSrc] = useState(card.imageLarge || card.imageSmall)
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div className={`card-art card-art-${size} card-art-fallback`} aria-hidden>
        <span>{card.name.slice(0, 1)}</span>
      </div>
    )
  }

  return (
    <div className={`card-art card-art-${size}`}>
      <img
        src={src}
        alt={card.name}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => {
          if (src === card.imageLarge && card.imageSmall) setSrc(card.imageSmall)
          else setFailed(true)
        }}
      />
    </div>
  )
}
