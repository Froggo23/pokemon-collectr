import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchCardsByIds,
  getCatalog,
  loadFeaturedCatalog,
} from '@/features/catalog/api/get-catalog'
import type { CatalogCard } from '@/features/catalog/types'
import {
  addCard,
  decrementCard,
  removeCard,
  setQuantity,
  valueInventory,
} from '@/features/portfolio/utils/valuation'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import {
  fetchInventoryRemote,
  saveInventoryRemote,
} from '../api/supabase-inventory'
import type { Inventory } from '../types'

const STORAGE_KEY = 'pokemon-collectr:inventory:v1'
const CACHE_KEY = 'pokemon-collectr:card-cache:v1'

function loadLocal(): Inventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Inventory
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l) => typeof l.cardId === 'string' && typeof l.quantity === 'number' && l.quantity > 0,
    )
  } catch {
    return []
  }
}

function loadCardCache(): Map<string, CatalogCard> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return new Map()
    const obj = JSON.parse(raw) as Record<string, CatalogCard>
    return new Map(Object.entries(obj))
  } catch {
    return new Map()
  }
}

function persistCardCache(map: Map<string, CatalogCard>) {
  try {
    const obj: Record<string, CatalogCard> = {}
    for (const [k, v] of map) obj[k] = v
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
  } catch {
    /* quota */
  }
}

export type BackendMode = 'local' | 'supabase' | 'loading' | 'live-api'

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>(loadLocal)
  const [cardMap, setCardMap] = useState<Map<string, CatalogCard>>(loadCardCache)
  const [catalogBrowse, setCatalogBrowse] = useState<CatalogCard[]>(() => getCatalog())
  const [backend, setBackend] = useState<BackendMode>('loading')
  const [syncError, setSyncError] = useState<string | null>(null)
  const skipNextSave = useRef(false)

  const registerCard = useCallback((card: CatalogCard) => {
    setCardMap((prev) => {
      if (prev.get(card.id)?.marketPriceUsd === card.marketPriceUsd && prev.get(card.id)?.imageLarge)
        return prev
      const next = new Map(prev)
      next.set(card.id, card)
      persistCardCache(next)
      return next
    })
  }, [])

  // Catalog for valuation = union of cached cards + browse list + seed
  const catalog = useMemo(() => {
    const map = new Map<string, CatalogCard>()
    for (const c of getCatalog()) map.set(c.id, c)
    for (const c of catalogBrowse) map.set(c.id, c)
    for (const [id, c] of cardMap) map.set(id, c)
    return [...map.values()]
  }, [cardMap, catalogBrowse])

  // Hydrate featured + inventory card details from live API
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setBackend('loading')
      try {
        const featured = await loadFeaturedCatalog()
        if (cancelled) return
        setCatalogBrowse(featured)
        featured.forEach(registerCard)

        const inv = loadLocal()
        if (inv.length) {
          const live = await fetchCardsByIds(inv.map((l) => l.cardId))
          if (cancelled) return
          setCardMap((prev) => {
            const next = new Map(prev)
            for (const [id, c] of live) next.set(id, c)
            persistCardCache(next)
            return next
          })
        }

        if (isSupabaseConfigured) {
          const remoteInv = await fetchInventoryRemote()
          if (remoteInv && !cancelled) {
            skipNextSave.current = true
            setInventory(remoteInv)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteInv))
            const live = await fetchCardsByIds(remoteInv.map((l) => l.cardId))
            if (!cancelled) {
              setCardMap((prev) => {
                const next = new Map(prev)
                for (const [id, c] of live) next.set(id, c)
                persistCardCache(next)
                return next
              })
            }
          }
          setBackend('supabase')
        } else {
          setBackend('live-api')
        }
      } catch (e: unknown) {
        if (cancelled) return
        setSyncError(e instanceof Error ? e.message : 'Load failed')
        setBackend('local')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [registerCard])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    if (backend !== 'supabase') return
    const t = window.setTimeout(() => {
      void saveInventoryRemote(inventory).then((r) => {
        if (!r.ok) setSyncError(r.error ?? 'save failed')
        else setSyncError(null)
      })
    }, 400)
    return () => window.clearTimeout(t)
  }, [inventory, backend])

  // Resolve missing card metadata when inventory changes
  useEffect(() => {
    const missing = inventory.map((l) => l.cardId).filter((id) => !cardMap.has(id))
    if (!missing.length) return
    let cancelled = false
    void fetchCardsByIds(missing).then((live) => {
      if (cancelled || !live.size) return
      setCardMap((prev) => {
        const next = new Map(prev)
        for (const [id, c] of live) next.set(id, c)
        persistCardCache(next)
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [inventory, cardMap])

  const valuation = useMemo(
    () => valueInventory(inventory, catalog),
    [inventory, catalog],
  )

  const add = useCallback(
    (cardId: string, card?: CatalogCard, qty = 1) => {
      if (card) registerCard(card)
      setInventory((prev) => addCard(prev, cardId, qty))
    },
    [registerCard],
  )

  const remove = useCallback((cardId: string) => {
    setInventory((prev) => removeCard(prev, cardId))
  }, [])

  const inc = useCallback((cardId: string) => {
    setInventory((prev) => addCard(prev, cardId, 1))
  }, [])

  const dec = useCallback((cardId: string) => {
    setInventory((prev) => decrementCard(prev, cardId))
  }, [])

  const setQty = useCallback((cardId: string, quantity: number) => {
    setInventory((prev) => setQuantity(prev, cardId, quantity))
  }, [])

  return {
    inventory,
    catalog,
    valuation,
    backend,
    syncError,
    registerCard,
    add,
    remove,
    inc,
    dec,
    setQty,
  }
}
