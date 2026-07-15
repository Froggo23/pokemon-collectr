import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCatalog } from '@/features/catalog/api/get-catalog'
import {
  fetchCatalogRemote,
  seedCatalogRemote,
} from '@/features/catalog/api/supabase-catalog'
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

export type BackendMode = 'local' | 'supabase' | 'loading'

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>(loadLocal)
  const [catalog, setCatalog] = useState<CatalogCard[]>(() => getCatalog())
  const [backend, setBackend] = useState<BackendMode>(
    isSupabaseConfigured ? 'loading' : 'local',
  )
  const [syncError, setSyncError] = useState<string | null>(null)
  const hydrated = useRef(false)
  const skipNextSave = useRef(false)

  // Hydrate from Supabase when configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBackend('local')
      return
    }
    let cancelled = false
    ;(async () => {
      setBackend('loading')
      // Ensure catalog rows exist
      await seedCatalogRemote()
      const remoteCatalog = await fetchCatalogRemote()
      const remoteInv = await fetchInventoryRemote()
      if (cancelled) return
      if (remoteCatalog?.length) setCatalog(remoteCatalog)
      if (remoteInv) {
        skipNextSave.current = true
        setInventory(remoteInv)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteInv))
      }
      setBackend('supabase')
      hydrated.current = true
    })().catch((e: unknown) => {
      if (cancelled) return
      setSyncError(e instanceof Error ? e.message : 'Supabase hydrate failed')
      setBackend('local')
      hydrated.current = true
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist local + remote
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

  const valuation = useMemo(
    () => valueInventory(inventory, catalog),
    [inventory, catalog],
  )

  const add = useCallback((cardId: string, qty = 1) => {
    setInventory((prev) => addCard(prev, cardId, qty))
  }, [])

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
    add,
    remove,
    inc,
    dec,
    setQty,
  }
}
