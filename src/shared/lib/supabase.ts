import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(
  url && anon && url.startsWith('https://') && anon.length > 20,
)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    client = createClient(url!, anon!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

const OWNER_KEY = 'pokefolio:owner_key'

/** Stable anonymous owner id for inventory rows (no auth). */
export function getOwnerKey(): string {
  try {
    let key = localStorage.getItem(OWNER_KEY)
    if (!key) {
      key = crypto.randomUUID()
      localStorage.setItem(OWNER_KEY, key)
    }
    return key
  } catch {
    return 'local-anonymous'
  }
}
