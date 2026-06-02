-- ============================================================
-- Family Orders Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Profiles table (role per user)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('ADMIN', 'BUYER')),
  display_name text null,
  created_at  timestamptz not null default now()
);

-- Orders table
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  ozon_url       text null,
  image_url      text null,
  expected_price numeric not null check (expected_price > 0),
  actual_price   numeric null check (actual_price >= 0),
  purchased      boolean not null default false,
  return_flag    boolean not null default false,
  is_settled     boolean not null default false,
  created_by     uuid not null references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz null
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- Profiles policies
drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can upsert own profile" on public.profiles;
create policy "Users can upsert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Orders policies
drop policy if exists "Authenticated users can read orders" on public.orders;
create policy "Authenticated users can read orders"
  on public.orders for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert orders" on public.orders;
create policy "Authenticated users can insert orders"
  on public.orders for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Authenticated users can update orders" on public.orders;
create policy "Authenticated users can update orders"
  on public.orders for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete orders" on public.orders;
create policy "Authenticated users can delete orders"
  on public.orders for delete
  to authenticated
  using (true);

-- ============================================================
-- Auto-create profile on sign up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'BUYER',  -- default role; change to ADMIN manually for Daughter
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- To assign roles manually after first sign in:
-- UPDATE public.profiles SET role = 'ADMIN' WHERE id = '<daughter-user-id>';
-- UPDATE public.profiles SET role = 'BUYER' WHERE id = '<mother-user-id>';
-- ============================================================
