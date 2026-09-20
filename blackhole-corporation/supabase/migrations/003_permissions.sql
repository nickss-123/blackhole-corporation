-- ============================================================
-- Migration: per-account checkbox permissions
-- Run in Supabase SQL Editor after 001 (schema.sql) and 002.
-- ============================================================

-- Catalog of every checkable ability. Add a row here any time a new
-- checkbox should exist in the admin UI — the UI reads this table.
create table if not exists public.permissions (
  key text primary key,
  label text not null,
  description text
);

insert into public.permissions (key, label, description) values
  ('create_main', 'Create Mains', 'Can create new Mains within a realm'),
  ('create_department', 'Create Departments', 'Can create new Departments within a Main'),
  ('add_member', 'Add members', 'Can add a member to a department (pending Admin confirmation)'),
  ('remove_member', 'Remove members', 'Can remove a member from a department'),
  ('flag_warn', 'Flag & warn', 'Can flag an account and issue warnings'),
  ('set_realm_theme', 'Set realm theme', 'Can set the background theme for a realm dashboard'),
  ('edit_department_roles', 'Edit department roles', 'Can add/edit/remove a department''s custom roles'),
  ('edit_department_rules', 'Edit department rules', 'Can edit a department''s rules list'),
  ('post_general_dashboard', 'Post to General Dashboard', 'Can upload videos to the General Dashboard feed'),
  ('manage_accounts', 'Manage accounts', 'Can create accounts and edit other accounts'' permissions')
on conflict (key) do nothing;

-- Which permissions a given account currently holds. Presence of a row = granted.
create table if not exists public.profile_permissions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (profile_id, permission_key)
);

alter table public.permissions enable row level security;
alter table public.profile_permissions enable row level security;

create policy "read permissions" on public.permissions
  for select using (auth.role() = 'authenticated');

create policy "read profile_permissions" on public.profile_permissions
  for select using (auth.role() = 'authenticated');

-- Direct table writes are still locked down (server actions use the
-- service-role key and check "manage_accounts"/higher_up_rank themselves),
-- but these policies exist as a safety net if RLS is ever the only gate.
create policy "higher ups grant permissions" on public.profile_permissions
  for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.higher_up_rank is not null)
  );

create policy "higher ups revoke permissions" on public.profile_permissions
  for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.higher_up_rank is not null)
  );

-- Higher Ups (or anyone with manage_accounts) need to update OTHER
-- people's profiles too (e.g. changing rank) — "update own profile"
-- from schema.sql only covers your own row.
create policy "higher ups update any profile" on public.profiles
  for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.higher_up_rank is not null)
  );
