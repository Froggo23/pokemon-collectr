#!/usr/bin/env node
/**
 * Apply Pokéfolio migration + seed via Supabase Management API / SQL.
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens
 *   SUPABASE_PROJECT_REF   — project ref (optional if creating new)
 *   Or: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY already in .env
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/setup-supabase.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const token = process.env.SUPABASE_ACCESS_TOKEN
const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN')
  console.error('Create one at https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

async function api(path, opts = {}) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${text.slice(0, 400)}`)
  }
  return body
}

async function main() {
  let ref = projectRef

  if (!ref) {
    console.log('No project ref — creating project pokefolio…')
    const orgs = await api('/organizations')
    const org = Array.isArray(orgs) ? orgs[0] : orgs
    const orgId = org?.id
    if (!orgId) throw new Error('No organization found on this token')
    const created = await api('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'pokefolio',
        organization_id: orgId,
        region: process.env.SUPABASE_REGION || 'us-east-1',
        db_pass: process.env.SUPABASE_DB_PASS || `Pokefolio_${Date.now()}!aA1`,
        plan: 'free',
      }),
    })
    ref = created.id || created.ref
    console.log('Created project', ref)
    // wait for project healthy
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 5000))
      try {
        const p = await api(`/projects/${ref}`)
        const status = p.status || p.subscription_id
        console.log('status poll', i, p.status)
        if (p.status === 'ACTIVE_HEALTHY' || p.status === 'ACTIVE_UNHEALTHY') break
      } catch {
        /* still provisioning */
      }
    }
  }

  const sql = readFileSync(
    resolve(root, 'supabase/migrations/20260716000000_pokefolio.sql'),
    'utf8',
  )

  console.log('Applying migration via database query API…')
  // Management SQL endpoint
  await api(`/projects/${ref}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query: sql }),
  })
  console.log('Migration applied')

  // Fetch anon key
  const keys = await api(`/projects/${ref}/api-keys`)
  const anon = (Array.isArray(keys) ? keys : []).find(
    (k) => k.name === 'anon' || k.tags?.includes('anon'),
  )
  const url = `https://${ref}.supabase.co`
  const anonKey = anon?.api_key || anon?.key

  if (anonKey) {
    const envPath = resolve(root, '.env')
    writeFileSync(
      envPath,
      `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${anonKey}\n`,
    )
    console.log('Wrote .env with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  } else {
    console.log('Could not read anon key automatically. Set VITE_SUPABASE_URL=', url)
  }

  console.log('Done. Run: bun run dev')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
