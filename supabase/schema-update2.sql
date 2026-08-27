-- ============================================================
-- 增量更新 2：式神图鉴表
-- 在 Supabase SQL Editor 中执行（可重复执行）
-- ============================================================

-- 式神表（结构化字段）
create table if not exists public.shikigami (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  rarity text not null default 'SSR' check (rarity in ('SP', 'SSR', 'SR', 'R')),
  type text,
  image_url text,
  description text,
  cultivate text,      -- 培养方式
  yuhun text,          -- 御魂推荐
  panel text,          -- 毕业面板
  pve text,            -- PVE 就业
  pvp text,            -- PVP 就业
  sort_order int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 触发器
drop trigger if exists shikigami_updated_at on public.shikigami;
create trigger shikigami_updated_at
  before update on public.shikigami
  for each row execute procedure public.touch_updated_at();

-- 启用 RLS
alter table public.shikigami enable row level security;

-- 授权
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- 策略：任何人可读；超管/所有权限/该栏目管理员可写
drop policy if exists "shikigami_select" on public.shikigami;
drop policy if exists "shikigami_admin" on public.shikigami;
create policy "shikigami_select" on public.shikigami for select using (true);
create policy "shikigami_admin" on public.shikigami for all
  using (public.can_manage_game(game_id))
  with check (public.can_manage_game(game_id));

notify pgrst, 'reload schema';