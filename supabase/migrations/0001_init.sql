-- ============================================================
-- PEDRITO PLANILHAS - schema inicial
-- 2 planilhas (free / vip) de apontamento de apostas
-- Leitura publica (view only). Escrita apenas para admins autenticados.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMs ----------
do $$ begin
  create type bet_group as enum ('free', 'vip');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bet_status as enum ('pending', 'green', 'red', 'void');
exception when duplicate_object then null; end $$;

-- ---------- Tabela: settings (banca inicial por grupo) ----------
create table if not exists public.settings (
  grp                bet_group primary key,
  starting_bankroll  numeric(12,2) not null default 1000,
  currency           text not null default 'EUR',
  updated_at         timestamptz not null default now()
);

insert into public.settings (grp, starting_bankroll) values ('free', 1000), ('vip', 1000)
on conflict (grp) do nothing;

-- ---------- Tabela: bets ----------
create table if not exists public.bets (
  id           uuid primary key default gen_random_uuid(),
  grp          bet_group   not null,
  event_date   date        not null default (now() at time zone 'utc')::date,
  team_a       text        not null,
  team_b       text        not null,
  market       text        not null,
  odd          numeric(6,3) not null check (odd >= 1),
  stake        numeric(12,2) not null check (stake >= 0),
  return_amount numeric(12,2) not null default 0 check (return_amount >= 0),
  status       bet_status  not null default 'pending',
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists bets_grp_date_idx on public.bets (grp, event_date);
create index if not exists bets_status_idx on public.bets (status);

-- profit calculado (green: retorno-stake | red: -stake | pending/void: 0)
alter table public.bets
  add column if not exists profit numeric(12,2)
  generated always as (
    case status
      when 'green' then return_amount - stake
      when 'red'   then -stake
      else 0
    end
  ) stored;

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists bets_touch on public.bets;
create trigger bets_touch before update on public.bets
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
alter table public.bets enable row level security;
alter table public.settings enable row level security;

-- Leitura publica (anon + authenticated)
drop policy if exists "bets_public_read" on public.bets;
create policy "bets_public_read" on public.bets for select using (true);

drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select using (true);

-- Escrita apenas para utilizadores autenticados (o(s) admin(s))
drop policy if exists "bets_admin_write" on public.bets;
create policy "bets_admin_write" on public.bets for all
  to authenticated using (true) with check (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings for all
  to authenticated using (true) with check (true);

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.bets;
alter publication supabase_realtime add table public.settings;
