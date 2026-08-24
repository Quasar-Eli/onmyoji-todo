-- ============================================================
-- 增量更新：新增 modules/comments 表 + 所有权限(global_editor) + 头像
-- 在已有数据库上执行此文件（可重复执行）
-- ============================================================

-- 1. profiles 增加头像列
alter table public.profiles add column if not exists avatar_url text;

-- 2. games 增加"所有权限用户"列（editor_id）
alter table public.games add column if not exists editor_id uuid references public.profiles(id) on delete set null;

-- 3. profiles 角色约束加 global_editor
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'game_admin', 'global_editor', 'super_admin'));

-- 4. 新建 modules 表
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 5. articles 增加 module_id 列
alter table public.articles add column if not exists module_id uuid references public.modules(id) on delete cascade;

-- 6. 新建 comments 表
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 7. 权限函数
create or replace function public.is_global_editor()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'global_editor'
  );
$$;

create or replace function public.can_manage_game(game uuid)
returns boolean
language sql security definer set search_path = public
as $$
  select public.is_super_admin() or public.is_global_editor() or public.is_game_admin(game);
$$;

-- 8. 启用 RLS（新表）
alter table public.modules enable row level security;
alter table public.comments enable row level security;

-- 9. 授权
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- 10. 策略
-- modules
drop policy if exists "modules_select" on public.modules;
drop policy if exists "modules_admin" on public.modules;
create policy "modules_select" on public.modules for select using (true);
create policy "modules_admin" on public.modules for all
  using (public.can_manage_game(game_id))
  with check (public.can_manage_game(game_id));

-- comments
drop policy if exists "comments_select" on public.comments;
drop policy if exists "comments_insert" on public.comments;
drop policy if exists "comments_delete" on public.comments;
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert
  with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete
  using (auth.uid() = user_id or public.is_super_admin());

-- categories/articles 策略改为 can_manage_game（含所有权限用户）
drop policy if exists "categories_admin" on public.categories;
create policy "categories_admin" on public.categories for all
  using (public.can_manage_game(game_id))
  with check (public.can_manage_game(game_id));

drop policy if exists "articles_admin" on public.articles;
create policy "articles_admin" on public.articles for all
  using (public.can_manage_game(game_id))
  with check (public.can_manage_game(game_id));

-- profiles 允许本人改头像（保留 update_self）
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

notify pgrst, 'reload schema';