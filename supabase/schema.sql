-- ============================================================
-- 多游戏 Wiki - Supabase Schema
-- 在 Supabase Dashboard -> SQL Editor 中整段执行
-- ============================================================

-- ---------- 扩展 ----------
create extension if not exists pgcrypto;

-- ---------- 1. profiles：用户档案 + 角色 ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  role text not null default 'user' check (role in ('user', 'game_admin', 'global_editor', 'super_admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 注册后自动创建档案
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- 2. games：栏目（游戏） ----------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  accent_color text default '#3b82f6',
  editor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- 3. game_admins：游戏 <-> 管理员 关联 ----------
create table if not exists public.game_admins (
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

-- ---------- 4. categories：每个游戏下的分类 ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- 5. modules：分类下的模块 ----------
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- 6. articles：内容（挂在模块下，模块单篇） ----------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  content text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 7. comments：评论/回复 ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at
  before update on public.articles
  for each row execute procedure public.touch_updated_at();

-- ---------- 辅助函数：判断角色 ----------
create or replace function public.is_super_admin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_global_editor()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'global_editor'
  );
$$;

create or replace function public.is_game_admin(game uuid)
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.game_admins
    where game_id = game and user_id = auth.uid()
  );
$$;

-- 是否可管理某个栏目：超管 或 所有权限用户 或 该栏目管理员
create or replace function public.can_manage_game(game uuid)
returns boolean
language sql security definer set search_path = public
as $$
  select public.is_super_admin() or public.is_global_editor() or public.is_game_admin(game);
$$;

-- ---------- 启用 RLS ----------
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_admins enable row level security;
alter table public.categories enable row level security;
alter table public.modules enable row level security;
alter table public.articles enable row level security;
alter table public.comments enable row level security;

-- ---------- 授予 anon / authenticated 角色权限（必须！否则手动建表时 PostgREST 403） ----------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- ---------- RLS 策略（先删后建，保证可重复执行） ----------
-- profiles：任何人可读（用于显示作者名），本人可改，超管可改角色
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_admin" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin" on public.profiles for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- games：任何人可读，仅超管可写
drop policy if exists "games_select" on public.games;
drop policy if exists "games_admin" on public.games;
create policy "games_select" on public.games for select using (true);
create policy "games_admin" on public.games for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- game_admins：任何人可读，仅超管可写
drop policy if exists "game_admins_select" on public.game_admins;
drop policy if exists "game_admins_admin" on public.game_admins;
create policy "game_admins_select" on public.game_admins for select using (true);
create policy "game_admins_admin" on public.game_admins for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- categories：任何人可读；超管/所有权限/该栏目管理员可写
drop policy if exists "categories_select" on public.categories;
drop policy if exists "categories_admin" on public.categories;
create policy "categories_select" on public.categories for select using (true);
create policy "categories_admin" on public.categories for all
  using (public.can_manage_game(game_id))
  with check (public.can_manage_game(game_id));

-- modules：任何人可读；超管/所有权限/该栏目管理员可写
drop policy if exists "modules_select" on public.modules;
drop policy if exists "modules_admin" on public.modules;
create policy "modules_select" on public.modules for select using (true);
create policy "modules_admin" on public.modules for all
  using (public.can_manage_game(game_id))
  with check (public.can_manage_game(game_id));

-- articles：任何人可读；超管/所有权限/该栏目管理员可写
drop policy if exists "articles_select" on public.articles;
drop policy if exists "articles_admin" on public.articles;
create policy "articles_select" on public.articles for select using (true);
create policy "articles_admin" on public.articles for all
  using (public.can_manage_game(game_id))
  with check (public.can_manage_game(game_id));

-- comments：任何人可读；登录用户可发表；作者本人或超管可删
drop policy if exists "comments_select" on public.comments;
drop policy if exists "comments_insert" on public.comments;
drop policy if exists "comments_delete" on public.comments;
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert
  with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete
  using (auth.uid() = user_id or public.is_super_admin());

-- ---------- 预置超管账号 admin / admin888 ----------
-- 若已存在同名邮箱则跳过
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@local.wiki',
  crypt('admin888', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin"}'
where not exists (select 1 from auth.users where email = 'admin@local.wiki');

-- 把 admin 账号标记为超管
insert into public.profiles (id, username, role)
select id, 'admin', 'super_admin'
from auth.users where email = 'admin@local.wiki'
on conflict (id) do update set role = 'super_admin';