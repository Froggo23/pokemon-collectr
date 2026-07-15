import { getOwnerKey, getSupabase } from '@/shared/lib/supabase'
import type { Inventory } from '../types'

interface DbLine {
  card_id: string
  quantity: number
}

export async function fetchInventoryRemote(): Promise<Inventory | null> {
  const sb = getSupabase()
  if (!sb) return null
  const owner = getOwnerKey()
  const { data, error } = await sb
    .from('pokefolio_inventory')
    .select('card_id,quantity')
    .eq('owner_key', owner)
  if (error) return null
  return (data as DbLine[]).map((r) => ({ cardId: r.card_id, quantity: r.quantity }))
}

export async function saveInventoryRemote(inventory: Inventory): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'not_configured' }
  const owner = getOwnerKey()

  // Replace strategy: delete all for owner, insert current lines
  const { error: delErr } = await sb.from('pokefolio_inventory').delete().eq('owner_key', owner)
  if (delErr) return { ok: false, error: delErr.message }

  if (inventory.length === 0) return { ok: true }

  const rows = inventory.map((l) => ({
    owner_key: owner,
    card_id: l.cardId,
    quantity: l.quantity,
    updated_at: new Date().toISOString(),
  }))
  const { error: insErr } = await sb.from('pokefolio_inventory').insert(rows)
  if (insErr) return { ok: false, error: insErr.message }
  return { ok: true }
}
