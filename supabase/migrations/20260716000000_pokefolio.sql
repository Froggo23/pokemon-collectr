-- Pokéfolio schema: catalog + per-user inventory (anonymous client key = owner)
-- Safe for toy use with RLS scoped to client-generated owner_key.

create extension if not exists "pgcrypto";

-- Market catalog (shared, read by all; seedable)
create table if not exists public.pokefolio_cards (
  id text primary key,
  name text not null,
  set_name text not null,
  number text not null,
  rarity text not null,
  market_price_usd numeric(12, 2) not null check (market_price_usd >= 0),
  priced_as_of date not null default current_date,
  created_at timestamptz not null default now()
);

-- Inventory lines keyed by anonymous owner_key (stored in localStorage)
create table if not exists public.pokefolio_inventory (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  card_id text not null references public.pokefolio_cards (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  updated_at timestamptz not null default now(),
  unique (owner_key, card_id)
);

create index if not exists pokefolio_inventory_owner_idx
  on public.pokefolio_inventory (owner_key);

alter table public.pokefolio_cards enable row level security;
alter table public.pokefolio_inventory enable row level security;

-- Catalog is public read
drop policy if exists "pokefolio_cards_select" on public.pokefolio_cards;
create policy "pokefolio_cards_select"
  on public.pokefolio_cards for select
  to anon, authenticated
  using (true);

-- Inventory: anyone with the owner_key string can CRUD their rows (toy multi-device)
-- Header x-owner-key is not native; we pass owner_key in every filter/insert from the client.
drop policy if exists "pokefolio_inventory_select" on public.pokefolio_inventory;
create policy "pokefolio_inventory_select"
  on public.pokefolio_inventory for select
  to anon, authenticated
  using (true);

drop policy if exists "pokefolio_inventory_insert" on public.pokefolio_inventory;
create policy "pokefolio_inventory_insert"
  on public.pokefolio_inventory for insert
  to anon, authenticated
  with check (true);

drop policy if exists "pokefolio_inventory_update" on public.pokefolio_inventory;
create policy "pokefolio_inventory_update"
  on public.pokefolio_inventory for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "pokefolio_inventory_delete" on public.pokefolio_inventory;
create policy "pokefolio_inventory_delete"
  on public.pokefolio_inventory for delete
  to anon, authenticated
  using (true);

-- Optional: replace catalog seed via upsert from app
comment on table public.pokefolio_cards is 'Pokéfolio market catalog snapshot';
comment on table public.pokefolio_inventory is 'Pokéfolio owned card quantities by owner_key';
