-- ============================================================
-- BLACKHOLE CORPORATION — Supabase schema (starter)
-- Run this in Supabase SQL Editor on a fresh project.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES (one row per auth.users, username-based login) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  nickname text,                          -- only Higher Ups / Auths may change this (enforced in app logic / RLS)
  avatar_url text,
  higher_up_rank text check (higher_up_rank in ('owner','supreme_chief','head_moderator','lead_moderator','moderator')),
  general_theme text default 'default',   -- customizable by the account owner, General Dashboard only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- REALMS (Estate, Academy, Syndicate) ----------
create table if not exists public.realms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  background_theme text default 'default', -- set only by that realm's authority
  created_at timestamptz not null default now()
);

-- ---------- AUTHS (per-realm authority tier, e.g. currently Estate only) ----------
create table if not exists public.realm_auths (
  id uuid primary key default gen_random_uuid(),
  realm_id uuid not null references public.realms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  auth_rank text not null check (auth_rank in ('head_admin','admin','supervisor')),
  created_at timestamptz not null default now(),
  unique (realm_id, profile_id)
);

-- ---------- MAINS (unlimited per realm, admin-created) ----------
create table if not exists public.mains (
  id uuid primary key default gen_random_uuid(),
  realm_id uuid not null references public.realms(id) on delete cascade,
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- DEPARTMENTS (unlimited per main) ----------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  main_id uuid not null references public.mains(id) on delete cascade,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- DEPARTMENT RULES (editable list per department) ----------
create table if not exists public.department_rules (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  rule_text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- DEPARTMENT ROLES (custom & editable per department, NOT shared) ----------
create table if not exists public.department_roles (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  role_name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (department_id, role_name)
);

-- ---------- DEPARTMENT MEMBERSHIP ----------
create table if not exists public.department_members (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid references public.department_roles(id),
  is_council boolean not null default false,
  status text not null default 'active' check (status in ('active','pending','suspended','removed')),
  suspended_until timestamptz,
  joined_at timestamptz not null default now(),
  unique (department_id, profile_id)
);

-- ---------- ADD-MEMBER REQUEST QUEUE (Council submits, Admin confirms) ----------
create table if not exists public.add_member_requests (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------- DEPARTMENT GROUP CHATS (Tambayan + Rankings, 2 per department) ----------
create table if not exists public.department_chats (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  chat_type text not null check (chat_type in ('tambayan','rankings')),
  created_at timestamptz not null default now(),
  unique (department_id, chat_type)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.department_chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------- WARNINGS / PENALTIES ----------
create table if not exists public.warnings (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  issued_by uuid not null references public.profiles(id),
  level int not null check (level between 1 and 4), -- 1/2/3 = warnings, 4 = major offense
  reason text,
  penalty text,
  suspended_until timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- TRANSFERS (max 3/week enforced in app logic) ----------
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  from_department_id uuid references public.departments(id),
  to_department_id uuid not null references public.departments(id),
  created_at timestamptz not null default now()
);

-- ---------- GENERAL DASHBOARD (Facebook-style video feed, all members) ----------
create table if not exists public.general_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  video_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — starter policies (tighten before production)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.realms enable row level security;
alter table public.realm_auths enable row level security;
alter table public.mains enable row level security;
alter table public.departments enable row level security;
alter table public.department_rules enable row level security;
alter table public.department_roles enable row level security;
alter table public.department_members enable row level security;
alter table public.add_member_requests enable row level security;
alter table public.department_chats enable row level security;
alter table public.messages enable row level security;
alter table public.warnings enable row level security;
alter table public.transfers enable row level security;
alter table public.general_posts enable row level security;

-- Everyone signed in can read most structural/reference data.
create policy "read profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "read realms" on public.realms for select using (auth.role() = 'authenticated');
create policy "read mains" on public.mains for select using (auth.role() = 'authenticated');
create policy "read departments" on public.departments for select using (auth.role() = 'authenticated');
create policy "read department_rules" on public.department_rules for select using (auth.role() = 'authenticated');
create policy "read department_roles" on public.department_roles for select using (auth.role() = 'authenticated');
create policy "read general_posts" on public.general_posts for select using (auth.role() = 'authenticated');

-- Users can update only their own profile row (nickname is app-enforced, not blocked here yet — see README).
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- A user can see their own department memberships; department-scoped visibility needs custom policies
-- once Council/Auth roles are modeled with a lookup — left as a next step (see README "Next steps").
create policy "read own memberships" on public.department_members for select using (auth.uid() = profile_id);

-- Everything else (writes to departments, mains, roles, warnings, chats, etc.) should go through
-- server actions using the service-role key, so permission logic (Admin/Council/Auths/Higher Ups)
-- lives in one place instead of being duplicated in RLS. Do NOT expose the service-role key client-side.
